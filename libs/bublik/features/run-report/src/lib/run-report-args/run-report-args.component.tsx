/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2025 OKTET LTD */
import { ComponentProps } from 'react';

import { List } from '../run-report-header';

interface RunReportArgsProps {
	items: ComponentProps<typeof List>['items'];
	label: string;
}

function RunReportArgs(props: RunReportArgsProps) {
	return <List label={props.label} items={props.items} />;
}

export { RunReportArgs };
export type { RunReportArgsProps };
