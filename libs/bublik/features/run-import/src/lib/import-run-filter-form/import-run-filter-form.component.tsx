/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { ImportTaskFilters, ImportTaskFiltersSchema } from '@/shared/types';
import {
	ButtonTw,
	Icon,
	Input,
	SelectField,
	Tooltip
} from '@/shared/tailwind-ui';

import { BUBLIK_TAG, bublikAPI } from '@/services/bublik-api';
import { useDispatch } from 'react-redux';

const statusOptions = [
	{ value: 'all', displayValue: 'All' },
	{ value: 'RECEIVED', displayValue: 'Received' },
	{ value: 'RUNNING', displayValue: 'Running' },
	{ value: 'SUCCESS', displayValue: 'Success' },
	{ value: 'FAILURE', displayValue: 'Failure' }
];

export interface ImportRunFilterProps {
	onFiltersChange?: (filters: ImportTaskFilters) => void;
	defaultValues?: ImportTaskFilters;
	onResetClick?: () => void;
}

export const ImportRunFilterForm = (props: ImportRunFilterProps) => {
	const {
		register,
		control,
		handleSubmit,
		formState: { errors }
	} = useForm<ImportTaskFilters>({
		defaultValues: props.defaultValues,
		resolver: zodResolver(ImportTaskFiltersSchema)
	});
	const dispatch = useDispatch();

	const handleInitialSubmit = () => {
		return handleSubmit((values) => {
			const status = values.status === 'all' ? undefined : values.status;
			dispatch(bublikAPI.util.invalidateTags([BUBLIK_TAG.importEvents]));

			return props.onFiltersChange?.({
				job: values.job,
				run: values.run,
				url: values.url?.trim(),
				celery_task: values.celery_task?.trim(),
				status
			});
		});
	};

	return (
		<form
			onSubmit={handleInitialSubmit()}
			className="flex flex-wrap items-center gap-4"
		>
			<div>
				<Input
					label="Job ID"
					placeholder="1"
					type="number"
					{...register('job', { valueAsNumber: true })}
					error={errors.job?.message}
				/>
			</div>
			<div>
				<Input
					label="Run ID"
					placeholder="123"
					type="number"
					{...register('run', { valueAsNumber: true })}
					error={errors.run?.message}
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
					{...register('celery_task')}
					error={errors.celery_task?.message}
				/>
			</div>
			<div>
				<SelectField
					name="status"
					placeholder="Select status"
					control={control}
					label="Status"
					options={statusOptions}
				/>
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
