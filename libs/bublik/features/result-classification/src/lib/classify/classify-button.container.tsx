/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { useState } from 'react';

import { LoginRequired } from '@/bublik/features/auth';
import { ButtonTw, Icon } from '@/shared/tailwind-ui';

import { useClassifyForm } from './classify-form.hooks';
import { ClassifyDrawer } from './classify-drawer.component';
import { useClassify } from './classify.hooks';

export interface ClassifyButtonProps {
	resultId: number;
	projectId?: number;
	/** The result already carries a stamp: the icon says so, and the drawer adds to it. */
	classified?: boolean;
}

export function ClassifyButton({
	resultId,
	projectId,
	classified = false
}: ClassifyButtonProps) {
	const [open, setOpen] = useState(false);
	const { submit, canClassify } = useClassify(resultId, projectId);
	const form = useClassifyForm();

	return (
		<>
			<LoginRequired message="Log in to classify results">
				<ButtonTw
					variant="secondary"
					size="xss"
					disabled={!canClassify}
					title={
						!canClassify
							? 'Select a project first'
							: classified
							? 'Add another classification'
							: undefined
					}
					onClick={() => setOpen(true)}
					data-testid="classify-trigger"
					data-result-id={resultId}
					data-classified={classified ? '' : undefined}
				>
					<Icon
						name={classified ? 'TriangleCheckmark' : 'TriangleExclamationMark'}
						size={20}
						className="mr-1.5"
					/>
					Classify
				</ButtonTw>
			</LoginRequired>

			<ClassifyDrawer
				open={open}
				onOpenChange={(next) => {
					setOpen(next);

					if (!next) form.reset();
				}}
				form={form}
				projectId={projectId}
				submit={submit}
				classified={classified}
			/>
		</>
	);
}
