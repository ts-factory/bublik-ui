/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { getErrorMessage } from '@/services/bublik-api';
import { Icon } from '@/shared/tailwind-ui';

import { HistoryWarningProps, HistoryWarning } from '../history-warning';

export interface HistoryError
	extends Pick<HistoryWarningProps, 'onButtonClick'> {
	error?: unknown;
	withoutStatus?: boolean;
}

export const HistoryError = (props: HistoryError) => {
	const { error, onButtonClick, withoutStatus } = props;
	const { status, title, description } = getErrorMessage(error);

	return (
		<HistoryWarning
			icon={
				<Icon
					name="TriangleExclamationMark"
					size={24}
					className="text-text-unexpected"
				/>
			}
			label={withoutStatus ? title : `${status} ${title}`}
			description={description}
			onButtonClick={onButtonClick}
		/>
	);
};
