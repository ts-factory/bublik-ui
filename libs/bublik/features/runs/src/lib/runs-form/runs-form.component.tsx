/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { forwardRef, useMemo } from 'react';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { DateValue } from '@internationalized/date';

import { analyticsEventNames, trackEvent } from '@/bublik/features/analytics';
import {
	ButtonTw,
	SearchBar,
	AriaDateRangePicker,
	Icon,
	TagsBoxInput,
	BoxValue
} from '@/shared/tailwind-ui';

import {
	areRunsFiltersSnapshotsEqual,
	createRunsFormFiltersSnapshot,
	type RunsFormFiltersSnapshot
} from './runs-form.utils';
import { RUN_DATA_GROUP_ORDER } from '../runs-slice.selectors';

export interface RunsFormValues {
	calendarMode: 'default' | 'duration';
	dates: { start: DateValue; end: DateValue } | null;
	runData: BoxValue[];
	tagExpr: string;
}

export interface RunsFormProps {
	defaultValues: RunsFormValues;
	appliedFilters: RunsFormFiltersSnapshot;
	onRunsFormSubmit: (newForm: RunsFormValues) => void;
	onResetFormClick: (resettedForm: RunsFormValues) => void;
}

export const RunsForm = forwardRef<HTMLFormElement, RunsFormProps>(
	(
		{ defaultValues, appliedFilters, onRunsFormSubmit, onResetFormClick },
		ref
	) => {
		const { control, register, handleSubmit, reset, getValues, setValue } =
			useForm<RunsFormValues>({ defaultValues });
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

		const currentFormValues = useMemo<RunsFormValues>(
			() => ({
				calendarMode: watchedValues.calendarMode ?? defaultValues.calendarMode,
				dates: currentDates,
				runData: currentRunData,
				tagExpr: watchedValues.tagExpr ?? defaultValues.tagExpr
			}),
			[
				currentDates,
				currentRunData,
				defaultValues.calendarMode,
				defaultValues.tagExpr,
				watchedValues.calendarMode,
				watchedValues.tagExpr
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

		const handleResetClick = () => {
			const resettedForm: RunsFormValues = {
				dates: null,
				calendarMode: defaultValues.calendarMode,
				runData: getValues().runData.map((v) => ({ ...v, isSelected: false })),
				tagExpr: ''
			};

			reset(resettedForm);
			onResetFormClick(resettedForm);
		};

		return (
			<form
				className="flex items-center gap-4"
				onSubmit={handleSubmit(onRunsFormSubmit)}
				ref={ref}
			>
				<div className="flex gap-4">
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

					<Controller
						render={({ field }) => (
							<TagsBoxInput
								label="Metas"
								valueLabel="Meta"
								createdGroupLabel="Metadata"
								groupOrder={RUN_DATA_GROUP_ORDER}
								placeholder="Metas"
								size="md"
								startIcon={
									<Icon
										name="Filter"
										size={20}
										className="mr-2 text-text-menu"
									/>
								}
								endIcon={
									<Icon name="AddSymbol" size={20} className="text-text-menu" />
								}
								values={field.value}
								onChange={(nextValues) => {
									trackEvent(analyticsEventNames.runsFormTagsEdit, {
										selectedCount: nextValues.filter((v) => v.isSelected)
											.length,
										totalCount: nextValues.length
									});
									field.onChange(nextValues);
								}}
							/>
						)}
						name="runData"
						control={control}
					/>
					<SearchBar {...register('tagExpr')} placeholder="Tag expression" />
				</div>
				<div className="flex gap-4">
					<ButtonTw
						size="md"
						rounded="lg"
						type="submit"
						variant={hasPendingFilterMismatch ? 'primary' : 'outline'}
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
