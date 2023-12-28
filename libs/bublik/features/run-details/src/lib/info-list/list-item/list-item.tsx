/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { FC } from 'react';

import {
	cn,
	CopyTooltip,
	toast,
	infoListItemStyles
} from '@/shared/tailwind-ui';

import { getDisplayText } from '../utils';

export type InfoListItem = {
	url?: string;
	name?: string;
	value?: string;
	isImportant?: boolean;
	className?: string;
};

export type InfoListItemProps = {
	item: InfoListItem;
	formatter?: (str: string) => string;
};

export const InfoListItem: FC<InfoListItemProps> = ({ item, formatter }) => {
	const { name, value, url, isImportant, className } = item;

	const bg = isImportant ? 'bg-badge-6' : className;
	const styles = cn(infoListItemStyles({ isLink: Boolean(url) }), bg);

	const { displayValue, copyValue } = getDisplayText(name, value);
	const formattedValue = formatter ? formatter(displayValue) : displayValue;

	const handleCopyUrlComplete = () => {
		toast.success('Copied revision to clipboard');
	};

	if (url) {
		return (
			<CopyTooltip
				copyString={copyValue}
				onCopyComplete={handleCopyUrlComplete}
			>
				<a className={styles} href={url} rel="noreferrer" target="_blank">
					{formattedValue}
				</a>
			</CopyTooltip>
		);
	}

	return (
		<CopyTooltip copyString={copyValue}>
			<div className={styles}>
				<span className="text-[0.625rem] font-medium leading-[1.125rem]">
					{formattedValue}
				</span>
			</div>
		</CopyTooltip>
	);
};
