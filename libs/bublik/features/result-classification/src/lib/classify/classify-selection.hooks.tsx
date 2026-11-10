/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { ReactElement, useMemo, useState } from 'react';

import { ClassifyDrawer } from './classify-drawer.component';
import { useClassifyForm } from './classify-form.hooks';
import { useClassify } from './classify.hooks';
import { resultsInRuns } from './classify.utils';
import type { ResultSelection } from './result-selection.context';
import {
	CLASSIFY_TARGETS_HINT,
	type RunResults
} from './result-selection.utils';

const NO_RUNS: RunResults[] = [];

/** What a Classify button for the whole selection draws and does. */
export interface ClassifySelectionTrigger {
	disabled: boolean;
	/** Why it is disabled, or what it would classify. */
	hint: string;
	/** How many results it would classify, once it can. */
	count: number | null;
	onClick: () => void;
}

export interface UseClassifySelectionOptions {
	/** Once every picked result is stamped, just before the selection drops. */
	onClassified?: () => void;
}

/**
 * Classify for the whole result selection, wherever it is offered from: the
 * selection popover, or a drawer that picks into the same selection. The
 * picks go out in one request, whatever runs they are of.
 *
 * The drawer is returned apart from the trigger, for the caller to mount
 * where it outlives the trigger: classifying drops the selection, and with
 * it whatever is drawn only while something is picked.
 */
export function useClassifySelection(
	selection: ResultSelection,
	{ onClassified }: UseClassifySelectionOptions = {}
): { trigger: ClassifySelectionTrigger; drawer: ReactElement } {
	const { targets, clear } = selection;
	const [open, setOpen] = useState(false);
	const runs = useMemo(() => (targets.ok ? targets.runs : NO_RUNS), [targets]);
	const projectId = targets.ok ? targets.projectId : undefined;
	const { submit, canClassify } = useClassify(runs, projectId);
	const form = useClassifyForm();
	const count = targets.ok ? targets.resultIds.length : null;

	const hint = !targets.ok
		? CLASSIFY_TARGETS_HINT[targets.reason]
		: !canClassify
		? 'Select a project first'
		: `Classify ${resultsInRuns(
				targets.resultIds.length,
				runs.length
		  )} under one issue`;

	const drawer = (
		<ClassifyDrawer
			open={open}
			onOpenChange={(next) => {
				setOpen(next);

				if (!next) form.reset();
			}}
			form={form}
			runs={runs}
			projectId={projectId}
			submit={async (input) => {
				const response = await submit(input);

				// Stamped: the rows will redraw with their stamps, and there is
				// nothing left to do with the selection.
				onClassified?.();
				clear();

				return response;
			}}
		/>
	);

	return {
		trigger: {
			disabled: !targets.ok || !canClassify,
			hint,
			count,
			onClick: () => setOpen(true)
		},
		drawer
	};
}
