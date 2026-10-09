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
 *
 * Seeding validates the field, so a "Choose a tracker" left by a submit that
 * raced the project config clears the moment the tracker arrives.
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

		setValue(TRACKER as Path<T>, defaultTracker as PathValue<T, Path<T>>, {
			shouldValidate: true
		});
	}, [
		defaultValues,
		dirtyFields,
		enabled,
		defaultTracker,
		getValues,
		setValue
	]);
}
