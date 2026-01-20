/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { DetailsItem } from '@/shared/types';

import { InfoListItem } from './info-list/list-item';

/**
|--------------------------------------------------
| TYPES
|--------------------------------------------------
*/

export interface InfoListItemConfig {
	isImportant?: boolean;
	backgroundColor?: string;
	formatter?: (value: string) => string;
}

/**
|--------------------------------------------------
| RUN INFO
|--------------------------------------------------
*/

export const formatDuration = (duratuionInSeconds: number) => {
	const hours = Math.floor(duratuionInSeconds / (60 * 60))
		.toString()
		.padStart(2, '0');
	const minutes = Math.floor((duratuionInSeconds % (60 * 60)) / 60)
		.toString()
		.padStart(2, '0');
	const seconds = Math.ceil((duratuionInSeconds % (60 * 60)) % 60)
		.toString()
		.padStart(2, '0');

	return `${hours}:${minutes}:${seconds}`;
};

export const prepareDuration = (dateString?: string) => {
	if (!dateString) return null;

	return formatDuration(parseInt(dateString));
};

export const formatSeparator = (value: string) => {
	return value.replace('=', ': ');
};

export const prepareRevisions = (
	items: DetailsItem[],
	backgroundColor: string
): InfoListItem[] => {
	return items.map((item) => ({
		value: item.value,
		className: backgroundColor,
		isImportant: false,
		name: item.name,
		url: item.url
	}));
};

export const prepareInfoListItems =
	(config: InfoListItemConfig) =>
	(items: string[]): InfoListItem[] => {
		const defaultConfig: InfoListItemConfig = { formatter: formatSeparator };
		const finalConfig = { ...defaultConfig, ...config };

		return items.map(createInfoListItem(finalConfig));
	};

export const extractUrlFromLabel = (item: string): string | undefined => {
	const parts = item.split('=');

	if (parts.length >= 2) {
		const value = parts.slice(1).join('=');

		if (value.startsWith('https://') || value.startsWith('http://')) {
			const urlMatch = value.match(/https?:\/\/[^\s,)\]}>]+/);
			return urlMatch ? urlMatch[0] : undefined;
		}
	}

	return undefined;
};

const createInfoListItem =
	(config: InfoListItemConfig) =>
	(item: string): InfoListItem => {
		const value = config.formatter ? config.formatter(item) : item;
		const url = extractUrlFromLabel(item);

		return {
			value,
			isImportant: config.isImportant,
			className: config.backgroundColor,
			url
		};
	};

export const prepareTags = (important: string[], relevant: string[]) => {
	const importantConfig: InfoListItemConfig = {
		isImportant: true,
		formatter: formatSeparator
	};

	const relevantConfig: InfoListItemConfig = {
		backgroundColor: 'bg-badge-0',
		formatter: formatSeparator
	};

	const preparedImportant = important.map(createInfoListItem(importantConfig));
	const preparedRelevant = relevant.map(createInfoListItem(relevantConfig));

	const combined = [...preparedImportant, ...preparedRelevant];

	return {
		relevant: preparedRelevant,
		important: preparedImportant,
		combined
	};
};
