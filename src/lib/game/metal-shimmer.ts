import { defaultFilterVert, Filter } from "pixi.js";

export const METAL_SHIMMER_STRENGTH = 0.5;
export const METAL_SHIMMER_SPEED = 5.0;
export const METAL_SHIMMER_BAND = 0.01;
export const METAL_SHIMMER_CURVE = 0.5;
export const METAL_SHIMMER_DETAIL = 0.25;
export const METAL_SHIMMER_SATURATION = 0.8;
export const METAL_SHIMMER_GAIN = 1.8;
export const METAL_SHIMMER_MAX_SHIPS = 5;

const METAL_SHIMMER_FRAGMENT = /* glsl */ `
in vec2 vTextureCoord;
out vec4 finalColor;

uniform sampler2D uTexture;
uniform float uTime;
uniform float uStrength;
uniform float uSpeed;
uniform float uBand;
uniform float uCurve;
uniform float uDetail;
uniform float uSaturation;
uniform float uGain;
uniform float uAspect;

float luminance(vec3 c) {
	return dot(c, vec3(0.299, 0.587, 0.114));
}

vec3 environment(vec3 dir) {
	float h = clamp(dir.y * 0.5 + 0.5, 0.0, 1.0);

	vec3 env = h < 0.5
		? mix(vec3(0.04, 0.06, 0.11), vec3(0.52, 0.70, 0.94), smoothstep(0.08, 0.5, h))
		: mix(vec3(0.52, 0.70, 0.94), vec3(0.86, 0.93, 1.00), smoothstep(0.5, 1.0, h));

	float horizon = 1.0 - smoothstep(0.0, 0.035, abs(h - 0.5));
	env += vec3(1.00, 0.98, 0.92) * horizon * 0.80;

	vec3 sun = normalize(vec3(-0.50, 0.75, 0.43));
	env += vec3(1.00, 0.95, 0.85) * pow(max(dot(dir, sun), 0.0), 90.0) * 1.60;

	return env;
}

void main() {
	vec4 base = texture(uTexture, vTextureCoord);
	float alpha = base.a;
	if (alpha <= 0.0) {
		finalColor = base;
		return;
	}

	vec3 straight = base.rgb / alpha;

	vec2 p = (vTextureCoord - 0.5) * vec2(uAspect, 1.0) * 2.0;
	float r2 = clamp(dot(p, p), 0.0, 1.0);
	vec3 n = normalize(vec3(p * uCurve, sqrt(max(1.0 - r2, 0.02))));

	vec2 stepX = vec2(uBand / uAspect, 0.0);
	vec2 stepY = vec2(0.0, uBand);
	float gx = luminance(texture(uTexture, vTextureCoord + stepX).rgb)
		- luminance(texture(uTexture, vTextureCoord - stepX).rgb);
	float gy = luminance(texture(uTexture, vTextureCoord + stepY).rgb)
		- luminance(texture(uTexture, vTextureCoord - stepY).rgb);
	n = normalize(n + vec3(gx, gy, 0.0) * uDetail);

	vec3 reflected = reflect(vec3(0.0, 0.0, -1.0), n);

	float roll = uTime * uSpeed;
	float cs = cos(roll);
	float sn = sin(roll);
	reflected.xy = vec2(
		reflected.x * cs - reflected.y * sn,
		reflected.x * sn + reflected.y * cs
	);
	reflected.y += sin(uTime * uSpeed * 0.5) * 0.5;
	reflected = normalize(reflected);

	vec3 metal = environment(reflected);
	metal += vec3(0.70, 0.85, 1.00) * pow(1.0 - clamp(n.z, 0.0, 1.0), 3.0) * 0.5;

	vec3 coated = straight * metal * uGain;
	vec3 tinted = mix(straight * 0.75, coated, uStrength);
	tinted = max(mix(vec3(luminance(tinted)), tinted, uSaturation), 0.0);
	finalColor = vec4(tinted * alpha, alpha);
}
`;

export interface MetalShimmer {
	readonly filter: Filter;
	update(time: number, aspect: number): void;
	destroy(): void;
}

export function createMetalShimmer(): MetalShimmer {
	const filter = Filter.from({
		gl: { vertex: defaultFilterVert, fragment: METAL_SHIMMER_FRAGMENT },
		resources: {
			shimmerUniforms: {
				uTime: { value: 0, type: "f32" },
				uStrength: { value: METAL_SHIMMER_STRENGTH, type: "f32" },
				uSpeed: { value: METAL_SHIMMER_SPEED, type: "f32" },
				uBand: { value: METAL_SHIMMER_BAND, type: "f32" },
				uCurve: { value: METAL_SHIMMER_CURVE, type: "f32" },
				uDetail: { value: METAL_SHIMMER_DETAIL, type: "f32" },
				uSaturation: { value: METAL_SHIMMER_SATURATION, type: "f32" },
				uGain: { value: METAL_SHIMMER_GAIN, type: "f32" },
				uAspect: { value: 1, type: "f32" },
			},
		},
	});

	return {
		filter,
		update(time, aspect) {
			const uniforms = filter.resources.shimmerUniforms.uniforms;
			uniforms.uTime = time;
			uniforms.uAspect = aspect;
		},
		destroy() {
			filter.destroy();
		},
	};
}
