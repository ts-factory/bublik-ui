/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { Facility, Severity } from '@/shared/types';

import { SelectValue } from '@/shared/tailwind-ui';

export const SEVERITY_MAP = new Map<Severity, string>([
	[Severity.INFO, 'Info'],
	[Severity.ERROR, 'Error'],
	[Severity.WARNING, 'Warning'],
	[Severity.DEBUG, 'Debug']
]);

export const FACILITY_MAP = new Map<Facility, string>([
	[Facility.AddTags, 'Add Tags'],
	[Facility.Celery, 'Celery'],
	[Facility.ImportRuns, 'Import'],
	[Facility.MetaCaterigozation, 'Meta Categorization']
]);

export const severityOptions: SelectValue[] = [
	{ value: 'all', displayValue: 'All' },
	...Array.from(SEVERITY_MAP.entries()).map(([value, displayValue]) => ({
		value,
		displayValue
	}))
];

export const facilityOptions: SelectValue[] = [
	{ value: 'all', displayValue: 'All' },
	...Array.from(FACILITY_MAP.entries()).map(([value, displayValue]) => ({
		value,
		displayValue
	}))
];
