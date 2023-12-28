/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { FC, ReactNode, isValidElement } from 'react';

import styles from './detail-item.module.scss';

export interface RunDetailsLabelProps {
	label: string;
	value?: string | number | ReactNode | null;
}

export const DetailItem: FC<RunDetailsLabelProps> = ({ label, value }) => {
	const renderValue = () => {
		if (isValidElement(value)) return value;

		return (
			<span className="text-[0.6875rem] font-medium leading-[0.875rem]">
				{value === null ? ' — ' : value}
			</span>
		);
	};

	return (
		<li className={styles['item']}>
			<div>
				<span className="text-[0.6875rem] font-medium leading-[0.875rem] text-text-menu">
					{label}
				</span>
			</div>

			<div className={styles['value-container']}>{renderValue()}</div>
		</li>
	);
};
