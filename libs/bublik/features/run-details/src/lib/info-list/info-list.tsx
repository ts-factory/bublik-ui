/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { FC } from 'react';

import { InfoListItem } from './list-item';
import styles from './info-list.module.scss';

export interface InfoListProps {
	label: string;
	items: InfoListItem[];
	formatter?: (str: string) => string;
}

export const InfoList: FC<InfoListProps> = ({ label, items, formatter }) => {
	return (
		<div className={styles['grid-list']}>
			<div className={styles['label']}>
				<span className="text-text-menu text-[0.6875rem] font-medium leading-[0.875rem]">
					{label}
				</span>
			</div>

			<div className={styles['list']}>
				<ul className="flex flex-wrap items-center gap-1">
					{items.map((item, idx) => (
						<InfoListItem key={idx} item={item} formatter={formatter} />
					))}
				</ul>
			</div>
		</div>
	);
};
