export const DEFAULT_CHANNEL = "Ku6epXBOCTuK";

export function extractNick(raw: string): string {
	const trimmed = raw.trim();
	if (!trimmed) return DEFAULT_CHANNEL;

	const urlMatch = trimmed.match(
		/(?:https?:\/\/)?(?:www\.|m\.)?twitch\.tv\/([a-z0-9_]+)/i,
	);
	if (urlMatch) return urlMatch[1];

	return trimmed.replace(/^@/, "");
}
