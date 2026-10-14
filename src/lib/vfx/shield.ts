import { SHIELD_MAX_HP } from "#lib/game/config.ts";
import {
	Container,
	Filter,
	Graphics,
	Sprite,
	Texture,
	defaultFilterVert,
} from "pixi.js";
import type { ShieldAuraState, VfxFrame, VfxStateful } from "./types.js";

/**
 * Настройки щита. Всё, что имеет смысл крутить, вынесено сюда.
 *
 * Геометрия: `radius` приходит из состояния — это половина большей стороны
 * корабля в мировых пикселях, уже с учётом `viewerScale`. `SHIELD_FACTOR`
 * задаёт, насколько щит шире корабля. Шейдер и кольца считаются от одного и
 * того же `SHIELD_FACTOR`, поэтому края всегда совпадают.
 */
const SHIELD_FACTOR = 1.3;
/** амплитуда «дыхания», доля радиуса корабля */
const BREATH = 0.05;
const BREATH_SPEED = 1.5;

/** гало вокруг щита: сколько колец и насколько далеко от края */
const HALO_RINGS = 3;
const HALO_STEP = 0.12;
const HALO_ALPHA = 0.05;

const OUTLINE_COLOR = 0x3fa9ff;
const RIM_COLOR = 0xcfeaff;
const BODY_ALPHA = 0.07;
const RIM_THICK = 0.0625;
const RIM_THICK_PER_CHARGE = 0.1875;
const RIM_INNER_THICK = 0.031;
const RIM_INNER_PER_CHARGE = 0.0625;

const DOT_COUNT = 8;
const DOT_SPEED = 0.6;
const TWINKLE_SPEED = 2.5;
const DOT_MIN = 0.0625;
const DOT_SPAN = 0.0625;

const PIP_BELOW = 0.72;
const PIP_GAP = 0.5;
const PIP_RADIUS = 0.156;
const PIP_MIN_STROKE = 1;

/**
 * Искажение от попадания — то, что крутится в первую очередь.
 *
 * Эти три константы попадают в шейдер строкой ниже, поэтому менять их
 * можно только здесь.
 */
export const SHIELD_HIT_PUSH = 0.5;
export const SHIELD_HIT_RINGS = 14;
export const SHIELD_HIT_FLASH = 0.9;

const SHIELD_FRAGMENT = /* glsl */ `
in vec2 vTextureCoord;
out vec4 finalColor;

uniform sampler2D uTexture;
uniform float uTime;
uniform float uCharge;
uniform float uHit;
uniform vec2 uHitDir;

// Стандартные uniform'ы фильтра Pixi. Нужны, чтобы привести координаты к
// локальным: при фильтре vTextureCoord не обязана покрывать 0..1.
uniform vec4 uOutputFrame;
uniform vec4 uInputSize;

float hash(vec2 p) {
	return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
	vec2 i = floor(p);
	vec2 f = fract(p);
	vec2 u = f * f * (3.0 - 2.0 * f);
	return mix(
		mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
		mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
		u.y
	);
}

void main() {
	vec4 base = texture(uTexture, vTextureCoord);
	if (base.a <= 0.002 || uCharge <= 0.0) {
		finalColor = vec4(0.0);
		return;
	}

	// Форму даёт сама текстура: альфа линейно падает от центра к краю,
	// поэтому r = 1 - alpha и не зависит от того, как Pixi считает UV.
	float r = clamp(1.0 - base.a, 0.0, 1.0);

	vec2 span = max(uOutputFrame.zw * uInputSize.zw, vec2(1e-6));
	vec2 p = (vTextureCoord / span - 0.5) * 2.0;

	float flow = uTime * 0.6;

	// Точка удара выталкивает узоры — это и есть искажение. Считаем её до
	// смещения, чтобы вспышка осталась на месте удара.
	vec2 hitPos = normalize(uHitDir + vec2(1e-5, 0.0));
	vec2 delta = p - hitPos;
	float hitDist = length(delta) + 1e-4;
	float strength = uHit * uHit;

	float shock = sin(hitDist * 14.0 - (1.0 - uHit) * 12.0);
	p += (delta / hitDist) * shock * strength * ${SHIELD_HIT_PUSH.toFixed(3)};

	float angle = atan(p.y, p.x);

	// перелив: волны бегут по кругу и по радиусу, шум ломает правильность
	float warp = noise(p * 3.0 + flow) * 2.0;
	float ripple = sin(r * 9.0 - flow * 2.0 + warp);
	float swirl = sin(angle * 3.0 + flow);

	float wave = 0.5 + 0.5 * (ripple * 0.6 + swirl * 0.4);
	float rim = pow(r, 3.0);

	// вспышка в точке удара и волны, расходящиеся от неё
	float flash = strength * smoothstep(0.55, 0.0, hitDist);
	float rings = sin(hitDist * ${SHIELD_HIT_RINGS.toFixed(1)} - (1.0 - uHit) * 12.0) * strength;
	float impact = flash + rings * 0.35;

	vec3 deep = vec3(0.05, 0.22, 0.42);
	vec3 edge = vec3(0.25, 0.66, 1.00);
	vec3 hot = vec3(0.81, 0.92, 1.00);

	vec3 color = mix(deep, edge, wave);
	color = mix(color, hot, rim * 0.7);
	color += hot * max(impact, 0.0) * ${SHIELD_HIT_FLASH.toFixed(3)};

	float alpha = (0.10 + 0.22 * wave + 0.35 * rim) * uCharge;
	alpha *= 1.0 + max(impact, 0.0) * 0.8;

	finalColor = vec4(color * alpha, alpha);
}
`;

/**
 * Текстура-круг: альфа линейно падает от центра к краю. Благодаря этому
 * шейдер получает точную форму и точный радиус, не завися от того, как Pixi
 * считает координаты текстуры для фильтра. Углов квадрата прозрачны, поэтому
 * спрайт можно спокойно тянуть на весь диаметр щита.
 */
const DISC_SIZE = 256;
let discTexture: Texture | null = null;

function getDiscTexture(): Texture {
	if (discTexture) return discTexture;
	const canvas = document.createElement("canvas");
	canvas.width = DISC_SIZE;
	canvas.height = DISC_SIZE;
	const painter = canvas.getContext("2d");
	if (painter) {
		const gradient = painter.createRadialGradient(
			DISC_SIZE / 2,
			DISC_SIZE / 2,
			0,
			DISC_SIZE / 2,
			DISC_SIZE / 2,
			DISC_SIZE / 2,
		);
		gradient.addColorStop(0, "rgba(255,255,255,1)");
		gradient.addColorStop(1, "rgba(255,255,255,0)");
		painter.fillStyle = gradient;
		painter.fillRect(0, 0, DISC_SIZE, DISC_SIZE);
	}
	discTexture = Texture.from(canvas);
	return discTexture;
}

/**
 * Силовой щит: переливающаяся шейдерная оболочка плюс точки зарядов.
 *
 * Форму щита даёт текстура-круг, шейдер только красит её содержимое, поэтому
 * спрайт можно тянуть на любой размер и край всегда совпадёт с кольцами.
 */
export function createShieldAura(): VfxStateful<ShieldAuraState> {
	const bubble = Sprite.from(getDiscTexture());
	bubble.anchor.set(0.5);

	const uniforms = {
		uTime: { value: 0, type: "f32" },
		uCharge: { value: 1, type: "f32" },
		uHit: { value: 0, type: "f32" },
		uHitDir: { value: new Float32Array([0, 1]), type: "vec2<f32>" },
	};

	bubble.filters = [
		Filter.from({
			gl: { vertex: defaultFilterVert, fragment: SHIELD_FRAGMENT },
			resources: { shieldUniforms: uniforms },
		}),
	];

	const rings = new Graphics();
	const pips = new Graphics();
	const root = new Container();
	root.addChild(bubble, rings, pips);

	const aura: VfxStateful<ShieldAuraState> = {
		root,
		state: {
			hp: SHIELD_MAX_HP,
			max: SHIELD_MAX_HP,
			radius: 0,
			hit: 0,
			hitDir: { x: 0, y: 1 },
		},

		update(frame: VfxFrame) {
			const { hp, max, radius, hit, hitDir } = aura.state;
			const frac = max > 0 ? Math.max(0, hp / max) : 0;

			uniforms.uTime.value = frame.t;
			uniforms.uCharge.value = frac;
			uniforms.uHit.value = hit;
			(uniforms.uHitDir.value as Float32Array)[0] = hitDir.x;
			(uniforms.uHitDir.value as Float32Array)[1] = hitDir.y;

			rings.clear();
			pips.clear();
			if (radius <= 0) return;

			const px = (units: number) => Math.max(0.5, radius * units);
			// Единственный источник правды: видимый край щита.
			const edge =
				radius * SHIELD_FACTOR +
				Math.sin(frame.t * BREATH_SPEED + frame.phase) * radius * BREATH;

			bubble.x = frame.x;
			bubble.y = frame.y;
			bubble.width = edge * 2;
			bubble.height = edge * 2;

			for (let i = HALO_RINGS; i >= 1; i--) {
				rings.circle(frame.x, frame.y, edge + radius * HALO_STEP * i).stroke({
					color: OUTLINE_COLOR,
					alpha: HALO_ALPHA * frac * (HALO_RINGS + 1 - i),
					width: px(0.04),
				});
			}

			rings
				.circle(frame.x, frame.y, edge)
				.fill({ color: OUTLINE_COLOR, alpha: BODY_ALPHA * frac })
				.circle(frame.x, frame.y, edge)
				.stroke({
					color: OUTLINE_COLOR,
					alpha: 0.1 + 0.2 * frac,
					width: px(RIM_THICK + RIM_THICK_PER_CHARGE * frac),
				})
				.circle(frame.x, frame.y, edge)
				.stroke({
					color: RIM_COLOR,
					alpha: 0.85 * frac,
					width: px(RIM_INNER_THICK + RIM_INNER_PER_CHARGE * frac),
				});

			for (let i = 0; i < DOT_COUNT; i++) {
				const dot =
					(i / DOT_COUNT) * Math.PI * 2 + frame.t * DOT_SPEED + frame.phase;
				const twinkle =
					0.4 +
					0.6 *
						Math.abs(Math.sin(frame.t * TWINKLE_SPEED + i * 1.7 + frame.phase));
				rings
					.circle(
						frame.x + Math.cos(dot) * edge,
						frame.y + Math.sin(dot) * edge,
						px(DOT_MIN + DOT_SPAN * twinkle),
					)
					.fill({ color: RIM_COLOR, alpha: twinkle * frac });
			}

			const gap = radius * PIP_GAP;
			const dotY = frame.y + edge * PIP_BELOW;
			const dotStartX = frame.x + edge * PIP_BELOW - gap;
			for (let i = 0; i < max; i++) {
				const dotX = dotStartX + i * gap;
				if (i < hp) {
					pips
						.circle(dotX, dotY, radius * PIP_RADIUS)
						.fill({ color: RIM_COLOR, alpha: 0.9 });
				} else {
					pips.circle(dotX, dotY, radius * PIP_RADIUS).stroke({
						color: OUTLINE_COLOR,
						alpha: 0.4,
						width: Math.max(PIP_MIN_STROKE, radius * PIP_RADIUS * 0.4),
					});
				}
			}
		},

		destroy() {
			root.destroy();
		},
	};

	return aura;
}
