/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2025 OKTET LTD */
import {
	getErrorMessage,
	useGetLogJsonQuery,
	useGetRunDetailsQuery,
	useGetTreeByRunIdQuery
} from '@/services/bublik-api';
import { RootBlock } from '@/shared/types';
import { ButtonTw, Icon, Tooltip } from '@/shared/tailwind-ui';

import { getBugProps, NewBugButton } from './new-bug.component';

const LoadingState = () => (
	<ButtonTw variant="secondary" size="xss" state="loading">
		<Icon name="ProgressIndicator" className="size-5 mr-1.5 animate-spin" />
		<span>New Bug</span>
	</ButtonTw>
);

type FailedRequest = 'run details' | 'run tree' | 'log';

interface ErrorStateProps {
	failed: FailedRequest;
	error: unknown;
}

function getErrorHint(failed: FailedRequest, error: unknown): string {
	const { title, description } = getErrorMessage(error);
	const reason = description ? `${title}: ${description}` : title;

	return `Can't build the bug report: failed to load ${failed}. ${reason}`;
}

// The `disabled` variant turns pointer events off, which would also swallow
// the hover the tooltip needs — same trick the config page buttons use.
const ErrorState = ({ failed, error }: ErrorStateProps) => (
	<Tooltip content={getErrorHint(failed, error)}>
		<ButtonTw
			variant="secondary"
			size="xss"
			disabled
			className="pointer-events-auto"
		>
			<Icon name="IssueIcon" className="size-5 mr-1.5" />
			<span>New Bug</span>
		</ButtonTw>
	</Tooltip>
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
	const { data: details, error: detailsError } = useGetRunDetailsQuery(
		props.runId
	);
	const { data: log, error: logError } = useGetLogJsonQuery({
		id: props.resultId
	});
	const { data: tree, error: treeError } = useGetTreeByRunIdQuery(
		String(props.runId)
	);
	const tables = getLogTablesFromLog(log);

	// Errors first: a query that failed never gets `data`, so checking
	// `!details || !tree` alone would show the spinner forever.
	if (detailsError) {
		return <ErrorState failed="run details" error={detailsError} />;
	}

	if (treeError) {
		return <ErrorState failed="run tree" error={treeError} />;
	}

	if (logError) {
		return <ErrorState failed="log" error={logError} />;
	}

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
