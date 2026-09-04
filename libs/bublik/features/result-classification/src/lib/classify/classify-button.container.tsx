/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { useState } from 'react';

import { ButtonTw, Icon } from '@/shared/tailwind-ui';

import { useClassifyForm } from './classify-form.hooks';
import { ClassifyDrawer } from './classify-drawer.component';
import { useClassify } from './classify.hooks';

export interface ClassifyButtonProps {
	resultId: number;
	projectId?: number;
}

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
				onOpenChange={(next) => {
					setOpen(next);

					if (!next) form.reset();
				}}
				form={form}
				projectId={projectId}
				submit={submit}
			/>
		</>
	);
}
