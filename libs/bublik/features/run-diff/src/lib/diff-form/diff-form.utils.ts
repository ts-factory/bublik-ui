/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */

/**
 * The pathname of a pasted run page URL (`https://host/v2/runs/42`): the
 * whole pathname, case-insensitive, trailing slashes tolerated, as React
 * Router's `matchPath('/v2/runs/:id')` matched it.
 */
const RUN_URL_PATHNAME = /^\/v2\/runs\/([^/]+)\/*$/i;

/** A path segment percent-decoded, or as it is when it is not valid encoding. */
function decodeSegment(segment: string): string {
	try {
		return decodeURIComponent(segment);
	} catch {
		return segment;
	}
}

/** The run id the diff form was given: a number, or a run page URL. */
function extractRunId(value: string): number | Error {
	const num = Number(value);
	if (!isNaN(num) && value.trim() !== '') return num;

	try {
		const url = new URL(value);
		const match = RUN_URL_PATHNAME.exec(url.pathname);
		if (match) return Number(decodeSegment(match[1]));
		return new Error('Invalid run URL format');
	} catch (e) {
		return new Error('Invalid run ID or URL');
	}
}

export { extractRunId };
