/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { forwardRef, useMemo } from 'react';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { DateValue } from '@internationalized/date';

import { analyticsEventNames, trackEvent } from '@/bublik/features/analytics';
import {
	ButtonTw,
	AriaDateRangePicker,
	Icon,
	BoxValue,
	MetaFilterInput,
	MetaFilterChip,
	MetaFilterSuggestionGroup,
	joinExpressions,
	splitExpressions
} from '@/shared/tailwind-ui';
import { config } from '@/bublik/config';

import {
	areRunsFiltersSnapshotsEqual,
	createRunsFormFiltersSnapshot,
	type RunsFormFiltersSnapshot
} from './runs-form.utils';
import {
	DEFAULT_RUN_EXPRESSION_KIND,
	EMPTY_RUN_EXPRESSIONS,
	RUN_EXPRESSION_KINDS,
	RUN_EXPRESSION_PARAM,
	RUN_EXPRESSION_PARAMS,
	RunExpressionKind,
	RunExpressions,
	isRunExpressionKind
} from './runs-expressions';
import { RUN_DATA_GROUP_ORDER } from '../runs-slice.selectors';

export interface RunsFormValues extends RunExpressions {
	calendarMode: 'default' | 'duration';
	dates: { start: DateValue; end: DateValue } | null;
	runData: BoxValue[];
}

export interface RunsFormProps {
	defaultValues: RunsFormValues;
	appliedFilters: RunsFormFiltersSnapshot;
	/** The project's metas, grouped by kind, as `useRunsMetaSuggestions` offers them. */
	metaSuggestions?: readonly MetaFilterSuggestionGroup[];
	metaSuggestionsLoading?: boolean;
	onMetaSuggestionsRequest?: () => void;
	onRunsFormSubmit: (newForm: RunsFormValues) => void;
	onResetFormClick: (resettedForm: RunsFormValues) => void;
}

const META_GROUP_LABEL = RUN_DATA_GROUP_ORDER[1];

/**
 * The form's run data and expressions as the chips of one input: the
 * selected run data are the value chips, each kind's expression splits on
 * its top-level `&` into expression chips of that kind.
 */
function toChips(
	runData: BoxValue[],
	expressions: RunExpressions
): MetaFilterChip[] {
	return [
		...runData
			.filter((value) => value.isSelected)
			.map((value) => ({
				id: `value:${value.value}`,
				value: value.value,
				isExpression: false
			})),
		...RUN_EXPRESSION_KINDS.flatMap((kind) =>
			splitExpressions(expressions[RUN_EXPRESSION_PARAM[kind]]).map(
				(text, index) => ({
					id: `expression:${kind}:${index}:${text}`,
					value: text,
					isExpression: true,
					kind
				})
			)
		)
	];
}

/** The chips of each kind joined into that kind's expression. */
function toExpressions(chips: MetaFilterChip[]): RunExpressions {
	const byKind = new Map<RunExpressionKind, string[]>(
		RUN_EXPRESSION_KINDS.map((kind) => [kind, []])
	);
	for (const chip of chips) {
		if (!chip.isExpression) continue;
		const kind = isRunExpressionKind(chip.kind)
			? chip.kind
			: DEFAULT_RUN_EXPRESSION_KIND;
		byKind.get(kind)?.push(chip.value);
	}

	return Object.fromEntries(
		RUN_EXPRESSION_KINDS.map((kind) => [
			RUN_EXPRESSION_PARAM[kind],
			joinExpressions(byKind.get(kind) ?? [])
		])
	) as RunExpressions;
}

export const RunsForm = forwardRef<HTMLFormElement, RunsFormProps>(
	(
		{
			defaultValues,
			appliedFilters,
			metaSuggestions = [],
			metaSuggestionsLoading = false,
			onMetaSuggestionsRequest,
			onRunsFormSubmit,
			onResetFormClick
		},
		ref
	) => {
		const { control, handleSubmit, reset, getValues, setValue } =
			useForm<RunsFormValues>({
				defaultValues,
				values: defaultValues,
				resetOptions: { keepDirtyValues: true }
			});
		const watchedValues = useWatch({ control });

		const currentDates: RunsFormValues['dates'] = useMemo(
			() =>
				watchedValues.dates?.start && watchedValues.dates?.end
					? {
							start: watchedValues.dates.start as DateValue,
							end: watchedValues.dates.end as DateValue
					  }
					: defaultValues.dates,
			[
				defaultValues.dates,
				watchedValues?.dates?.end,
				watchedValues?.dates?.start
			]
		);

		const currentRunData: RunsFormValues['runData'] =
			watchedValues.runData?.every(
				(value): value is BoxValue =>
					typeof value?.label === 'string' && typeof value?.value === 'string'
			)
				? watchedValues.runData
				: defaultValues.runData;

		const currentExpressions = useMemo<RunExpressions>(
			() =>
				Object.fromEntries(
					RUN_EXPRESSION_PARAMS.map((param) => [
						param,
						watchedValues[param] ?? defaultValues[param]
					])
				) as RunExpressions,
			// One string per kind; the object is rebuilt only when one changes.
			// eslint-disable-next-line react-hooks/exhaustive-deps
			[
				...RUN_EXPRESSION_PARAMS.map((param) => watchedValues[param]),
				...RUN_EXPRESSION_PARAMS.map((param) => defaultValues[param])
			]
		);

		const currentFormValues = useMemo<RunsFormValues>(
			() => ({
				calendarMode: watchedValues.calendarMode ?? defaultValues.calendarMode,
				dates: currentDates,
				runData: currentRunData,
				...currentExpressions
			}),
			[
				currentDates,
				currentRunData,
				currentExpressions,
				defaultValues.calendarMode,
				watchedValues.calendarMode
			]
		);

		const hasPendingFilterMismatch = useMemo(
			() =>
				!areRunsFiltersSnapshotsEqual(
					createRunsFormFiltersSnapshot(currentFormValues),
					appliedFilters
				),
			[appliedFilters, currentFormValues]
		);

		const chips = useMemo(
			() => toChips(currentRunData, currentExpressions),
			[currentRunData, currentExpressions]
		);

		const findSuggestionGroup = (value: string) =>
			metaSuggestions.find((group) => group.items.includes(value));
		const chipClassName = (value: string) =>
			currentRunData.find((box) => box.value === value)?.className ??
			findSuggestionGroup(value)?.className;

		const handleChipsChange = (
			nextChips: MetaFilterChip[],
			onRunDataChange: (runData: BoxValue[]) => void
		) => {
			const selected = new Set(
				nextChips.filter((chip) => !chip.isExpression).map((chip) => chip.value)
			);
			const known = new Set(currentRunData.map((box) => box.value));
			const nextRunData: BoxValue[] = [
				...currentRunData.map((box) => ({
					...box,
					isSelected: selected.has(box.value)
				})),
				...Array.from(selected)
					.filter((value) => !known.has(value))
					.map<BoxValue>((value) => {
						// Grouped as the table groups the run data: the list's
						// Important and Tags are those groups, the rest is metadata.
						const group = findSuggestionGroup(value);
						const groupLabel = RUN_DATA_GROUP_ORDER.find(
							(label) => label === group?.label
						);
						return {
							label: value,
							value,
							isSelected: true,
							className: group?.className,
							groupLabel: groupLabel ?? META_GROUP_LABEL
						};
					})
			];
			const nextExpressions = toExpressions(nextChips);

			trackEvent(analyticsEventNames.runsFormTagsEdit, {
				selectedCount: selected.size,
				expressionCount: nextChips.length - selected.size,
				totalCount: nextRunData.length
			});
			onRunDataChange(nextRunData);
			for (const param of RUN_EXPRESSION_PARAMS) {
				setValue(param, nextExpressions[param], { shouldDirty: true });
			}
		};

		const handleResetClick = () => {
			const resettedForm: RunsFormValues = {
				dates: null,
				calendarMode: defaultValues.calendarMode,
				runData: getValues().runData.map((v) => ({ ...v, isSelected: false })),
				...EMPTY_RUN_EXPRESSIONS
			};

			// `resetOptions.keepDirtyValues` holds for this reset too, so the
			// unsubmitted edits would survive it: clear them by hand first.
			setValue('dates', resettedForm.dates);
			setValue('calendarMode', resettedForm.calendarMode);
			setValue('runData', resettedForm.runData);
			for (const param of RUN_EXPRESSION_PARAMS) {
				setValue(param, resettedForm[param]);
			}
			reset(resettedForm);
			onResetFormClick(resettedForm);
		};

		return (
			<form
				className="flex items-start gap-4"
				onSubmit={handleSubmit(onRunsFormSubmit)}
				ref={ref}
			>
				<div className="shrink-0">
					<Controller
						name="dates"
						control={control}
						render={({ field }) => (
							<AriaDateRangePicker
								mode={currentFormValues.calendarMode}
								onModeChange={(mode) => setValue('calendarMode', mode)}
								label="Runs Range"
								enabledModes={['default', 'duration']}
								hideLabel
								{...field}
							/>
						)}
					/>
				</div>
				<Controller
					name="runData"
					control={control}
					render={({ field }) => (
						<MetaFilterInput
							ref={field.ref}
							variant="toolbar"
							label="Metas"
							name="runData"
							chips={chips}
							onChipsChange={(next) => handleChipsChange(next, field.onChange)}
							suggestions={metaSuggestions}
							suggestionsLoading={metaSuggestionsLoading}
							onSuggestionsRequest={onMetaSuggestionsRequest}
							chipClassName={chipClassName}
							keyValueDisplayDelimiter={config.keyValueDisplayDelimiter}
							keyValueSubmitDelimiter={config.keyValueSubmitDelimiter}
							placeholder="Metas or expression"
							helpNoun="meta"
							hideLabel
							// Kept in scale with the date picker; focus opens it over the
							// table with every chip.
							className="w-80 shrink-0"
						/>
					)}
				/>
				<div className="flex shrink-0 gap-4">
					<ButtonTw
						size="md"
						rounded="lg"
						type="submit"
						variant={hasPendingFilterMismatch ? 'primary' : 'outline'}
						// Primary has no border; a clear one keeps it the outline's size.
						className={
							hasPendingFilterMismatch
								? 'border border-transparent py-[7px]'
								: undefined
						}
					>
						<Icon name="Refresh" size={24} className="mr-1.5" />
						<span>Submit</span>
					</ButtonTw>
					<ButtonTw
						type="button"
						aria-label="Reset form"
						variant="outline"
						className="grid w-10 h-10 rounded-md place-items-center text-text-menu hover:text-primary"
						onClick={handleResetClick}
					>
						<Icon name="Bin" size={24} />
					</ButtonTw>
				</div>
			</form>
		);
	}
);
