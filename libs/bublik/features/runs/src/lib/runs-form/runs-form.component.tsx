/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { forwardRef } from 'react';
import { useForm, Controller } from 'react-hook-form';

import {
	ButtonTw,
	SearchBar,
	AriaDateRangePicker,
	Icon,
	TagsBoxInput,
	BoxValue
} from '@/shared/tailwind-ui';
import { DateValue } from '@internationalized/date';

export interface RunsFormValues {
	dates: { start: DateValue; end: DateValue } | null;
	runData: BoxValue[];
	tagExpr: string;
}

export interface RunsFormProps {
	defaultValues: RunsFormValues;
	onRunsFormSubmit: (newForm: RunsFormValues) => void;
	onResetFormClick: (resettedForm: RunsFormValues) => void;
}

export const RunsForm = forwardRef<HTMLFormElement, RunsFormProps>(
	({ defaultValues, onRunsFormSubmit, onResetFormClick }, ref) => {
		const { control, register, handleSubmit, reset, getValues } =
			useForm<RunsFormValues>({ defaultValues });

		const handleResetClick = () => {
			const resettedForm: RunsFormValues = {
				dates: null,
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
							<AriaDateRangePicker hideLabel label="Runs range" {...field} />
						)}
					/>

					<Controller
						render={({ field }) => (
							<TagsBoxInput
								label="Tags"
								valueLabel="Tag"
								placeholder="Tags"
								startIcon={
									<Icon
										name="Filter"
										size={20}
										className="mr-2 text-text-menu"
									/>
								}
								endIcon={<Icon name="AddSymbol" size={20} className="ml-2" />}
								values={field.value}
								onChange={field.onChange}
							/>
						)}
						name="runData"
						control={control}
					/>
					<SearchBar {...register('tagExpr')} placeholder="Tag expression" />
				</div>
				<div className="flex gap-4">
					<button
						type="button"
						aria-label="Reset form"
						className="grid w-10 h-10 transition-colors rounded-md place-items-center text-text-menu bg-primary-wash hover:text-primary"
						onClick={handleResetClick}
					>
						<Icon name="Bin" size={24} />
					</button>
					<ButtonTw size="md" rounded="lg" type="submit" variant="primary">
						Submit
					</ButtonTw>
				</div>
			</form>
		);
	}
);
