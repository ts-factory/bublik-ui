/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2025 OKTET LTD */
import {
	useGetLogJsonQuery,
	useGetRunDetailsQuery,
	useGetTreeByRunIdQuery
} from '@/services/bublik-api';
import { getBugProps, NewBugButton } from '@/shared/tailwind-ui';

interface NewBugProps {
	runId: number;
	resultId: number;
}

function NewBugContainer(props: NewBugProps) {
	const { data: details } = useGetRunDetailsQuery(props.runId);
	const { data: log } = useGetLogJsonQuery({ id: props.resultId });
	const { data: tree } = useGetTreeByRunIdQuery(String(props.runId));

	console.log(log);

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
		/>
	);
}

export { NewBugContainer };
