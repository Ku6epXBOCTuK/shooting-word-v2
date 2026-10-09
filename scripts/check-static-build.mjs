import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import process from "node:process";

const BUILD_DIR = "build";

const FORBIDDEN = [
	"TWITCH_CLIENT_SECRET",
	"TWITCH_CLIENT_ID",
	"node:sqlite",
	'"/api/',
	"'/api/",
	"`/api/",
	'"/auth/twitch',
	"'/auth/twitch",
	"`/auth/twitch",
];

function* walk(dir) {
	for (const entry of readdirSync(dir)) {
		const path = join(dir, entry);
		if (statSync(path).isDirectory()) {
			yield* walk(path);
		} else {
			yield path;
		}
	}
}

let found = 0;

for (const file of walk(BUILD_DIR)) {
	const content = readFileSync(file, "utf8");
	for (const pattern of FORBIDDEN) {
		if (content.includes(pattern)) {
			console.error(`FORBIDDEN "${pattern}" in ${relative(BUILD_DIR, file)}`);
			found++;
		}
	}
}

if (found > 0) {
	console.error(
		`\nstatic build check failed: ${found} forbidden occurrence(s)`,
	);
	process.exit(1);
}

console.log("static build check passed");
