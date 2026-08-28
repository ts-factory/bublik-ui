/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { useState } from 'react';

import { ButtonTw, Icon } from '@/shared/tailwind-ui';

import { useClassifyForm } from './classify-form';
import { ClassifyDrawer } from './classify-drawer';
import { useClassify } from './use-classify';

export interface ClassifyButtonProps {
	resultId: number;
	/**
	 * Project the result belongs to. On a run page this comes from the result
	 * itself, so classify works regardless of the global project selector.
	 */
	projectId?: number;
}

/**
 * Opens the classify drawer. There used to be a popover in front of it holding
 * a cut-down version of the same form, with a link across to the drawer for
 * anyone who needed the match rules — two surfaces, one form, and a decision to
 * make before you could start typing. The drawer is the whole form, so it is
 * the only surface now.
 */
export function ClassifyButton({ resultId, projectId }: ClassifyButtonProps) {
	const [open, setOpen] = useState(false);
	const { submit, canClassify } = useClassify(resultId, projectId);
	const form = useClassifyForm();

	return (
		<>
			<ButtonTw
				variant="secondary"
				size="xss"
				disabled={!canClassify}
				title={!canClassify ? 'Select a project first' : undefined}
				onClick={() => setOpen(true)}
				data-testid="classify-trigger"
				data-result-id={resultId}
			>
				<Icon name="TriangleExclamationMark" size={20} className="mr-1.5" />
				Classify
			</ButtonTw>

			<ClassifyDrawer
				open={open}
				onOpenChange={setOpen}
				form={form}
				projectId={projectId}
				submit={submit}
			/>
		</>
	);
}
