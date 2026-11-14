/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { LoginRequired } from '@/bublik/features/auth';
import { ButtonTw, Icon, Tooltip } from '@/shared/tailwind-ui';

import type { ClassifySelectionTrigger } from './classify-selection.hooks';

export interface ClassifySelectionButtonProps {
	trigger: ClassifySelectionTrigger;
}

/**
 * The selection's Classify, as a footer's full-width primary button: the
 * selection popover's, and a drawer's that picks into the same selection.
 */
export function ClassifySelectionButton({
	trigger
}: ClassifySelectionButtonProps) {
	return (
		// Half and half with the button beside it, whatever the labels' widths.
		// Signed out, the inert wrapper has to stretch too, or the button
		// shrinks to its label.
		<LoginRequired
			message="Log in to classify results"
			className="w-full [&>span]:w-full"
		>
			<Tooltip content={trigger.hint}>
				<ButtonTw
					variant="primary"
					rounded="lg"
					size="sm/2"
					className="w-full justify-center"
					disabled={trigger.disabled}
					onClick={trigger.onClick}
					data-testid="bulk-classify-trigger"
				>
					<Icon name="TriangleExclamationMark" size={20} className="mr-2" />
					<span>
						Classify{trigger.count !== null ? ` ${trigger.count}` : ''}
					</span>
				</ButtonTw>
			</Tooltip>
		</LoginRequired>
	);
}
