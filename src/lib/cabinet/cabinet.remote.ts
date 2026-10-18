import { dev } from "$app/env";
import { command, getRequestEvent, query } from "$app/server";
import { error } from "@sveltejs/kit";
import * as v from "valibot";
import { normalizeSettings } from "#lib/game/settings.js";
import { broadcasters } from "#lib/server/broadcasters/index.js";
import { sessionBroadcaster } from "#lib/server/resolve-broadcaster.js";
import { settings } from "#lib/server/settings/index.js";

// NOTE: cabinet remote functions authenticate with the session cookie, and the
// request event is the only place a remote call can read it from.
function requireSession() {
	const broadcaster = sessionBroadcaster(getRequestEvent().cookies);
	if (!broadcaster) error(401, "unauthorized");

	return broadcaster;
}

export const cabinetSession = query(() => {
	const broadcaster = requireSession();

	return {
		login: broadcaster.login,
		displayName: broadcaster.displayName,
		widgetUuid: broadcaster.widgetUuid,
		settings: normalizeSettings(
			settings.load(broadcaster.userId),
			undefined,
			dev,
		),
	};
});

export const saveSettings = command(v.unknown(), (raw) => {
	const broadcaster = requireSession();

	settings.save(broadcaster.userId, normalizeSettings(raw, undefined, dev));

	return { ok: true };
});

export const rotateWidgetUuid = command(() => {
	const broadcaster = requireSession();

	return { widgetUuid: broadcasters.rotateUuid(broadcaster.userId) };
});
