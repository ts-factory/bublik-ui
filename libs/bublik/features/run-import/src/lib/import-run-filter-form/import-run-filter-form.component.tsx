/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { LogQuery, LogQuerySchema } from '@/shared/types';
import {
	ButtonTw,
	DatePickerField,
	Icon,
	Input,
	SelectField,
	Tooltip
} from '@/shared/tailwind-ui';

import { facilityOptions, severityOptions } from '../utils';

export interface ImportRunFilterProps {
	onFiltersChange?: (filters: LogQuery) => void;
	defaultValues?: LogQuery;
	onResetClick?: () => void;
}

export const ImportRunFilterForm = (props: ImportRunFilterProps) => {
	const {
		register,
		control,
		handleSubmit,
		formState: { errors }
	} = useForm<LogQuery>({
		defaultValues: props.defaultValues,
		resolver: zodResolver(LogQuerySchema)
	});

	const handleInitialSubmit = () => {
		return handleSubmit((values) => {
			const severity = values.severity === 'all' ? undefined : values.severity;
			const facility = values.facility === 'all' ? undefined : values.facility;

			return props.onFiltersChange?.({
				severity,
				facility,
				date: values.date,
				msg: values.msg?.trim(),
				task_id: values.task_id?.trim(),
				url: values.url?.trim()
			});
		});
	};

	return (
		<form
			onSubmit={handleInitialSubmit()}
			className="flex flex-wrap items-center gap-4"
		>
			<div>
				<SelectField
					name="severity"
					placeholder="Select severity"
					control={control}
					label="Severity"
					options={severityOptions}
				/>
			</div>
			<div>
				<SelectField
					name="facility"
					placeholder="Select facility"
					control={control}
					label="Facility"
					options={facilityOptions}
				/>
			</div>
			<div>
				<Input
					label="Message"
					placeholder="Message..."
					{...register('msg')}
					error={errors.msg?.message}
				/>
			</div>
			<div>
				<Input
					label="URL"
					placeholder="https://example.com/logs/2022/11/14/fili-mcx5-14/"
					{...register('url')}
					error={errors.url?.message}
				/>
			</div>
			<div>
				<Input
					label="Task ID"
					placeholder="c8a4d0b8-b3d4-4b38-9dbd-352fcd8beae0"
					{...register('task_id')}
					error={errors.task_id?.message}
				/>
			</div>
			<div>
				<DatePickerField label="Date" name="date" control={control} />
			</div>
			<div className="flex items-center gap-4">
				<ButtonTw
					size="md"
					rounded="lg"
					className="justify-center"
					type="submit"
					variant="primary"
				>
					<Icon name="Refresh" size={24} className="mr-1.5" />
					<span>Submit</span>
				</ButtonTw>
				<Tooltip content="Reset Filters">
					<ButtonTw
						type="button"
						variant="outline"
						aria-label="Reset Form"
						className="grid size-10 place-items-center text-text-menu hover:text-primary"
						onClick={props.onResetClick}
					>
						<Icon name="Bin" size={24} />
					</ButtonTw>
				</Tooltip>
			</div>
		</form>
	);
};
