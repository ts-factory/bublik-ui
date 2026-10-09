import { type BadgeItem } from '@/shared/tailwind-ui';
import { config } from '@/bublik/config';
import { formatKeyValueForDisplay } from '@/shared/utils';

export const MATCHER_HINTS = {
	parameters: 'The result must carry all of these, matched exactly.',
	verdicts: 'The result must carry all of these verdicts.',
	tags: 'Run-level gate — a run missing any of these is skipped entirely.'
} as const;

export function badgeItems(values: string[]): BadgeItem[] {
	return values.map((value) => ({ id: value, value }));
}

export function parametersToItems(
	parameters: Record<string, string> | null | undefined
): BadgeItem[] {
	return badgeItems(
		Object.entries(parameters ?? {}).map(
			([key, value]) => `${key}${config.keyValueSubmitDelimiter}${value}`
		)
	);
}

export function listToItems(values: string[] | null | undefined): BadgeItem[] {
	return badgeItems(values ?? []);
}

export function itemsToParameters(
	items: BadgeItem[] | undefined
): Record<string, string> {
	const parameters: Record<string, string> = {};

	(items ?? []).forEach((item) => {
		const separator = item.value.indexOf(config.keyValueSubmitDelimiter);

		if (separator <= 0) return;

		const key = item.value.slice(0, separator).trim();
		const value = item.value
			.slice(separator + config.keyValueSubmitDelimiter.length)
			.trim();

		if (key) parameters[key] = value;
	});

	return parameters;
}

export function itemsToList(items: BadgeItem[] | undefined): string[] {
	return (items ?? []).map((item) => item.value.trim()).filter(Boolean);
}

export function displayKeyValue(value: string): string {
	return formatKeyValueForDisplay(value, {
		displayDelimiter: config.keyValueDisplayDelimiter,
		submitDelimiter: config.keyValueSubmitDelimiter
	});
}
