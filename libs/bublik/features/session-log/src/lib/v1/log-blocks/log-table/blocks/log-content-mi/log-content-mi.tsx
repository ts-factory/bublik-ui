/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { lazy, Suspense } from 'react';

import { LogContentMiBlock, LogContentMiChartSchema } from '@/shared/types';
import { checkSchema } from '@/shared/utils';
import { JsonViewer, Spinner } from '@/shared/tailwind-ui';

const LogMiChart = lazy(() =>
	import('./blocks/log-mi-chart').then((module) => ({
		default: module.LogMiChart
	}))
);

export const BlockLogContentChart = (props: LogContentMiBlock) => {
	if (!checkSchema(LogContentMiChartSchema, props.content)) {
		return <JsonViewer src={props.content} />;
	}

	return (
		<Suspense fallback={<Spinner className="h-48" />}>
			<LogMiChart {...props.content} />
		</Suspense>
	);
};
