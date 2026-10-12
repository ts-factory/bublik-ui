/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { describe, expect, it } from 'vitest';

import { config } from '@/bublik/config';

import { normalizeAnalyticsPath } from './tracker';

// The analytics backend groups page views by these strings.
describe('normalizeAnalyticsPath', () => {
	it.each([
		['/runs/1', '/runs/:runId'],
		['/runs/1/', '/runs/:runId'],
		['/runs/1/report', '/runs/:runId/report'],
		[
			'/runs/1/results/2/measurements',
			'/runs/:runId/results/:resultId/measurements'
		],
		['/log/1', '/log/:runId'],
		['/log/1/2', '/log/:runId/:old'],
		['/auth/register/activate/a/b/', '/auth/register/activate/:userId/:token'],
		[
			'/auth/forgot_password/password_reset/1/tok',
			'/auth/forgot_password/password_reset/:userId/:resetToken'
		]
	])('reports %s as %s', (pathname, reported) => {
		expect(normalizeAnalyticsPath(pathname)).toBe(reported);
	});

	it('reports a page without params as its path, trailing slash trimmed', () => {
		expect(normalizeAnalyticsPath('/dashboard/')).toBe('/dashboard');
		expect(normalizeAnalyticsPath('/runs/1/issues')).toBe('/runs/1/issues');
		expect(normalizeAnalyticsPath('')).toBe('/');
	});

	it('strips the base URL first, as on window.location', () => {
		expect(normalizeAnalyticsPath(`${config.baseUrl}/log/5`)).toBe(
			'/log/:runId'
		);
	});
});
