export const handleError = ({
	error,
	status,
}: {
	error: unknown;
	status: number;
}) => {
	if (status >= 500) {
		const detail =
			error instanceof Error ? (error.stack ?? error.message) : String(error);
		process.stderr.write(`[server] unhandled error: ${detail}\n`);
	}
};
