/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
interface ImportTaskRow {
	status: string;
	run_source_url: string;
	run_id: number | null;
	job_id?: number;
	error_msg?: string | null;
}

function isImportInProgress(task: ImportTaskRow): boolean {
	return ['RECEIVED', 'RUNNING'].includes(task.status.toUpperCase());
}

function successfulImportedRunId(task: ImportTaskRow): number | null {
	if (task.status.toUpperCase() !== 'SUCCESS') return null;

	const runId = Number(task.run_id);
	return Number.isFinite(runId) && runId > 0 ? runId : null;
}

function selectInProgressTask(
	taskHistory: ImportTaskRow[] | undefined
): ImportTaskRow | undefined {
	return taskHistory?.[0] && isImportInProgress(taskHistory[0])
		? taskHistory[0]
		: undefined;
}

function selectReusableSuccessfulTask(
	taskHistory: ImportTaskRow[] | undefined
): ImportTaskRow | undefined {
	const [latestTask, ...olderTasks] = taskHistory ?? [];
	if (!latestTask || isImportInProgress(latestTask)) return undefined;
	if (successfulImportedRunId(latestTask) !== null) return latestTask;

	return olderTasks.find((task) => successfulImportedRunId(task) !== null);
}

export {
	isImportInProgress,
	selectInProgressTask,
	selectReusableSuccessfulTask,
	successfulImportedRunId
};
export type { ImportTaskRow };
