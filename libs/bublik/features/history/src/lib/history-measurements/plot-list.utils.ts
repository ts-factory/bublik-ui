/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { SingleMeasurementChart } from '@/services/bublik-api';
import { PointSchema } from '@/shared/types';
import { Point } from '@/shared/types';

function resolvePoint(
	plot: SingleMeasurementChart,
	dataIndex: number
): Point | null {
	const dimensions = plot.dataset?.[0];
	const row = plot.dataset?.[dataIndex + 1];

	if (!dimensions || !row) return null;

	const rawData = dimensions.reduce<Record<string, unknown>>(
		(acc, curr, idx) => {
			acc[curr] = row[idx];
			return acc;
		},
		{}
	);

	const result = PointSchema.safeParse(rawData);

	if (!result.success) return null;

	return result.data;
}

export { resolvePoint };
