/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { bublikAPI } from '@/services/bublik-api';
import { RunCommentDrawer } from '@/bublik/features/run-details';

interface RunCommentEditorContainerProps {
	runId: number;
	/** The comment as the runs list has it, shown until the run answers. */
	listedComment: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

/**
 * The run page's comment drawer for a run of the runs table. The list can be
 * stale, and a backend older than its `comment` field lists no comments, so
 * what is edited is asked from the run itself: one request for the run whose
 * editor is opened.
 */
function RunCommentEditorContainer(props: RunCommentEditorContainerProps) {
	const { runId, listedComment, open, onOpenChange } = props;
	const { data } = bublikAPI.useGetRunCommentQuery({ runId });

	return (
		<RunCommentDrawer
			runId={runId}
			comment={data ? data.comment ?? '' : listedComment}
			open={open}
			onOpenChange={onOpenChange}
		/>
	);
}

export { RunCommentEditorContainer };
