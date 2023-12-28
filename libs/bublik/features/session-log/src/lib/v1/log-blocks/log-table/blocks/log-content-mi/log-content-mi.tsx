/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { LogContentMiBlock, LogContentMiChartSchema } from '@/shared/types';

import { checkSchema } from '@/shared/utils';
import { JsonViewer } from '@/shared/tailwind-ui';

import { LogMiChart } from './blocks';

export const BlockLogContentChart = (props: LogContentMiBlock) => {
	if (!checkSchema(LogContentMiChartSchema, props.content)) {
		return <JsonViewer src={props.content} />;
	}

	return <LogMiChart {...props.content} />;
};
