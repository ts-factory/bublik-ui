/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { useEffect, useRef } from 'react';
import type {
	FieldValues,
	Path,
	PathValue,
	UseFormReturn
} from 'react-hook-form';

const TRACKER = 'tracker';

/**
 * Fills an empty Tracker field with the project's first configured tracker.
 *
 * It seeds once per set of default values rather than once per mount, because
 * `useIssueForm` resets the form when the issue it edits finally arrives — a
 * plain mount-once guard would seed against the placeholder defaults and then
 * lose the value to that reset. A field the user has touched is left alone, so
 * clearing the tracker keeps it cleared.
 */
export function useDefaultTracker<T extends FieldValues>(
	form: UseFormReturn<T>,
	defaultTracker: string,
	enabled = true
): void {
	const { getValues, setValue, formState } = form;
	const { defaultValues, dirtyFields } = formState;
	const seededFor = useRef<unknown>(null);

	useEffect(() => {
		if (seededFor.current === defaultValues) return;
		if (!enabled || !defaultTracker) return;

		seededFor.current = defaultValues;

		const isDirty = Boolean((dirtyFields as Record<string, unknown>)[TRACKER]);

		if (isDirty || getValues(TRACKER as Path<T>)) return;

		setValue(TRACKER as Path<T>, defaultTracker as PathValue<T, Path<T>>);
	}, [
		defaultValues,
		dirtyFields,
		enabled,
		defaultTracker,
		getValues,
		setValue
	]);
}
