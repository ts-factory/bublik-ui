/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2025 OKTET LTD */
import {
	useGetLogJsonQuery,
	useGetRunDetailsQuery,
	useGetTreeByRunIdQuery
} from '@/services/bublik-api';
import { RootBlock } from '@/shared/types';

import { getBugProps, NewBugButton } from './new-bug.component';

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

	if (!details || !tree || !log) return null;

	return (
		<NewBugButton
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
