/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2025 OKTET LTD */
import {
	useGetLogJsonQuery,
	useGetRunDetailsQuery,
	useGetTreeByRunIdQuery
} from '@/services/bublik-api';
import { RootBlock } from '@/shared/types';
import { ButtonTw, Icon } from '@/shared/tailwind-ui';

import { getBugProps, NewBugButton } from './new-bug.component';

const LoadingState = () => (
	<ButtonTw variant="secondary" size="xss" state="loading">
		<Icon name="ProgressIndicator" className="size-5 mr-1.5 animate-spin" />
		<span>New Bug</span>
	</ButtonTw>
);

function getLogTablesFromLog(data?: RootBlock) {
	if (!data) return [];

	return (
		data?.root
			.flatMap((d) => d.content)
			.filter((d) => d.type === 'te-log-table')
			.flatMap((d) => d.data) ?? []
	);
}

interface NewBugProps {
	runId: number;
	resultId: number;
}

function NewBugContainer(props: NewBugProps) {
	const { data: details } = useGetRunDetailsQuery(props.runId);
	const { data: log } = useGetLogJsonQuery({ id: props.resultId });
	const { data: tree } = useGetTreeByRunIdQuery(String(props.runId));
	const tables = getLogTablesFromLog(log);

	if (!details || !tree) return <LoadingState />;

	return (
		<NewBugButton
			key={log ? 'with-logs' : 'no-logs'}
			{...getBugProps({
				runId: props.runId,
				id: props.resultId ?? Number(props.runId),
				log,
				tree,
				details
			})}
			logs={tables}
		/>
	);
}

export { NewBugContainer };
