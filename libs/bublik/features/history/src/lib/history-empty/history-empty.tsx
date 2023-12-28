/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { FC } from 'react';

import { HistoryWarning } from '../history-warning';
import { Icon } from '@/shared/tailwind-ui';

export interface HistoryEmptyProps {
	type: 'no-results' | 'no-test-name';
	onOpenFormClick?: () => void;
}

export const HistoryEmpty: FC<HistoryEmptyProps> = ({
	type,
	onOpenFormClick
}) => {
	if (type === 'no-test-name') {
		return (
			<HistoryWarning
				label="No test name"
				description="No test name found. Please, add test name to filter"
				icon={
					<Icon
						name="TriangleExclamationMark"
						size={24}
						className="text-text-unexpected"
					/>
				}
				onButtonClick={onOpenFormClick}
			/>
		);
	}

	return (
		<HistoryWarning
			label="No results"
			description="No results found. Do you want to edit global search?"
			icon={
				<Icon
					name="InformationCircleExclamationMark"
					size={24}
					className="text-primary"
				/>
			}
			onButtonClick={onOpenFormClick}
		/>
	);
};
