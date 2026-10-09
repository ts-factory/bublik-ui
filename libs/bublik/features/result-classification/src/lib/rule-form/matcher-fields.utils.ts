import { type BadgeItem } from '@/shared/tailwind-ui';
import { config } from '@/bublik/config';
import { formatKeyValueForDisplay } from '@/shared/utils';

export const MATCHER_HINTS = {
	parameters:
		'A failure must carry every kept parameter with the same value. Parameters it has besides do not matter.',
	verdicts:
		'A failure must carry exactly these verdicts, in this order, and no others.',
	tags: 'The run must carry every kept tag; a run missing one is skipped entirely.'
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

/**
 * The verdicts a rule stores: null when the field is empty, since the server
 * takes `[]` as "a failure without any verdict", which the form cannot mean.
 */
export function itemsToVerdicts(
	items: BadgeItem[] | undefined
): string[] | null {
	const verdicts = itemsToList(items);

	return verdicts.length ? verdicts : null;
}

/** What a rule's verdicts say when there is no chip to show for them. */
export const NO_VERDICTS_TEXT = 'No verdicts';

export function displayKeyValue(value: string): string {
	return formatKeyValueForDisplay(value, {
		displayDelimiter: config.keyValueDisplayDelimiter,
		submitDelimiter: config.keyValueSubmitDelimiter
	});
}
