/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { FC } from 'react';

import { Tooltip, cn, Icon, ButtonTw } from '@/shared/tailwind-ui';

import { CardHeader } from '@/shared/tailwind-ui';

export interface TreeHeaderProps {
	hasErrors: boolean;
	isNokMode: boolean;
	isShowingRunLog: boolean;
	onScrollToFocusClick: () => void;
	onRunButtonClick: () => void;
	onNokClick: () => void;
}

export const TreeHeader: FC<TreeHeaderProps> = (props) => {
	const {
		hasErrors,
		isNokMode,
		isShowingRunLog,
		onScrollToFocusClick,
		onRunButtonClick,
		onNokClick
	} = props;

	return (
		<CardHeader label="Tree">
			<div className="flex items-center gap-2">
				<Tooltip content="Only NOK">
					<button
						className={cn(
							'p-1 border border-transparent rounded text-text-unexpected hover:bg-primary-wash disabled:border-border-primary disabled:text-border-primary disabled:cursor-not-allowed disabled:hover:bg-transparent transition-colors',
							isNokMode &&
								'bg-bg-error text-white hover:text-white hover:bg-bg-error'
						)}
						disabled={!hasErrors}
						onClick={onNokClick}
					>
						<Icon name="InformationCircleExclamationMark" size={16} />
					</button>
				</Tooltip>

				<ButtonTw
					variant="secondary"
					size="xss"
					state={isShowingRunLog && 'active'}
					onClick={onRunButtonClick}
				>
					Run log
				</ButtonTw>
				<ButtonTw variant="secondary" size="xss" onClick={onScrollToFocusClick}>
					<Icon name="Scan" size={20} className="mr-1.5" />
					Scroll to focus
				</ButtonTw>
			</div>
		</CardHeader>
	);
};
