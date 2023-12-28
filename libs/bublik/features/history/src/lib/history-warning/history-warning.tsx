/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { ReactNode } from 'react';

import { ButtonTw, Icon } from '@/shared/tailwind-ui';

export interface HistoryWarningProps {
	icon: ReactNode;
	label: string;
	description: string;
	onButtonClick?: () => void;
}

export const HistoryWarning = (props: HistoryWarningProps) => {
	return (
		<div className="grid place-items-center h-[calc(100vh-256px)]">
			<div className="flex flex-col items-center text-center">
				{props.icon}
				<h3 className="mt-2 text-sm font-medium text-gray-900">
					{props.label}
				</h3>
				<p className="mt-1 text-sm text-gray-500">{props.description}</p>
				{props.onButtonClick ? (
					<div className="mt-6">
						<ButtonTw
							type="button"
							variant="primary"
							rounded="lg"
							size="xs"
							onClick={props.onButtonClick}
						>
							<Icon name="Filter" className="mr-2" />
							Open Search
						</ButtonTw>
					</div>
				) : null}
			</div>
		</div>
	);
};
