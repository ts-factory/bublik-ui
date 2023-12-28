/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { Severity } from '@/shared/types';

export const getSeverityBgColor = (severity: Severity) => {
	const colorMap = new Map<Severity, string>([
		[Severity.DEBUG, 'bg-badge-6'],
		[Severity.ERROR, 'bg-badge-12 text-white'],
		[Severity.WARNING, 'bg-bg-warning text-white']
	]);

	return colorMap.get(severity) ?? 'bg-badge-0';
};
