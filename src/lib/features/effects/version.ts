export function shouldReload(
	serverVersion: string | undefined,
	clientVersion: string,
): boolean {
	if (!serverVersion) return false;
	if (serverVersion === "dev" || clientVersion === "dev") return false;
	return serverVersion !== clientVersion;
}
