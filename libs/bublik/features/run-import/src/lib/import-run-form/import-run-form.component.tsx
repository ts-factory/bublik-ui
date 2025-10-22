/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import {
	ComponentPropsWithoutRef,
	forwardRef,
	Fragment,
	useCallback,
	useEffect,
	useImperativeHandle
} from 'react';
import { z } from 'zod';
import {
	useFieldArray,
	UseFieldArrayRemove,
	UseFieldArrayReturn,
	useForm,
	UseFormReturn
} from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Project } from '@/services/bublik-api';

import {
	AriaDateRangeField,
	ButtonTw,
	Checkbox,
	cn,
	DialogDescription,
	DialogTitle,
	FormAlertError,
	Icon,
	SelectInput,
	TextField,
	toast,
	Tooltip
} from '@/shared/tailwind-ui';
import { ImportRunsFormSchema, ImportRunsFormValues } from '@/shared/types';

import { stringToArray } from './import-run-form.utils';

const DEFAULT_PROJECT_VALUE = 'default';

export interface ImportRunFormProps {
	onImportRunsSubmit?: (values: ImportRunsFormValues) => void;
	projects: Project[];
}

const defaultValues: ImportRunsFormValues = {
	runs: [
		{ url: '', force: null, range: null, project: null },
		{ url: '', force: null, range: null, project: null },
		{ url: '', force: null, range: null, project: null },
		{ url: '', force: null, range: null, project: null }
	]
};

export type ImportRunFormHandle = {
	form: UseFormReturn<ImportRunsFormValues>;
};

export const ImportRunForm = forwardRef<
	ImportRunFormHandle,
	ImportRunFormProps
>(({ onImportRunsSubmit, projects }, ref) => {
	const formControl = useForm<ImportRunsFormValues>({
		defaultValues,
		resolver: zodResolver(ImportRunsFormSchema)
	});

	useImperativeHandle(ref, () => ({ form: formControl }), [formControl]);

	const { fields, append, remove } = useFieldArray({
		name: 'runs',
		control: formControl.control
	});

	const handlePaste = useCallback(
		(e: ClipboardEvent) => {
			if ((e.target as HTMLElement).tagName === 'INPUT') return;

			const data = e.clipboardData;

			const text = data?.getData('text');

			if (!text) return;

			const urlArray = stringToArray(text).filter(Boolean);

			const isAllUrls = urlArray.every(
				(v) => z.string().url().safeParse(v).success
			);

			if (!isAllUrls) return toast.error('Pasted URLs are incorrect!');

			e.preventDefault();

			const parsedUrls = urlArray
				.map((v) => new URL(v))
				.map((u) => {
					const urlPieces = [u.protocol, '//', u.host, u.pathname];
					const url = urlPieces.join('');
					const force = u.searchParams.get('force') === 'true';
					const fromStr = u.searchParams.get('from');
					const toStr = u.searchParams.get('to');

					if (!fromStr || !toStr) return { url, force, range: null };

					const range = {
						startDate: new Date(fromStr),
						endDate: new Date(toStr)
					};

					return { url, force, range };
				});

			remove(fields.map((_, idx) => idx));
			append(parsedUrls);
		},
		[append, fields, remove]
	);

	useEffect(() => {
		document.addEventListener('paste', handlePaste);
		return () => document.removeEventListener('paste', handlePaste);
	}, [handlePaste]);

	const HEADER = ['URL', 'RANGE', ''];

	const rootError = formControl.formState.errors.root?.message;

	const handleGlobalForceChange = (checked: boolean) => {
		fields.forEach((_, idx) => {
			formControl.setValue(`runs.${idx}.force`, checked);
		});
	};

	const handleProjectFieldChange = (value: string) => {
		fields.forEach((_, idx) => {
			if (value === DEFAULT_PROJECT_VALUE) {
				formControl.setValue(`runs.${idx}.project`, null);
				return;
			}

			formControl.setValue(`runs.${idx}.project`, parseInt(value));
		});
	};

	const allForceEnabled =
		fields.length > 0 &&
		fields.every((_, index) => {
			const value = formControl.watch(`runs.${index}.force`);
			return value === true;
		});

	const projectOptions = [
		{
			value: DEFAULT_PROJECT_VALUE,
			displayValue: 'No Project (Default)'
		},
		...projects.map((project) => ({
			value: project.id.toString(),
			displayValue: project.name
		}))
	];

	const runs = formControl.watch('runs');

	const uniqueProjects = new Set(
		runs.map((run) => run.project?.toString() ?? DEFAULT_PROJECT_VALUE)
	);

	const projectValue =
		uniqueProjects.size === 1 ? [...uniqueProjects][0] : DEFAULT_PROJECT_VALUE;

	return (
		<>
			<DialogTitle className="text-lg font-semibold leading-none tracking-tight">
				Import Runs
			</DialogTitle>
			{rootError ? (
				<FormAlertError title={'Error'} description={rootError} />
			) : null}
			<form
				className="flex flex-col gap-4 mt-2"
				onSubmit={formControl.handleSubmit((form) =>
					onImportRunsSubmit?.({
						...form,
						runs: form.runs.filter((v) => v.url)
					})
				)}
			>
				<SelectInput
					label="Project"
					options={projectOptions}
					value={projectValue}
					onValueChange={handleProjectFieldChange}
				/>
				<p className="text-gray-500 text-sm leading-relaxed font-normal space-y-1">
					<span>
						Run must be linked to a project. If it isn’t, the import will fail.{' '}
						<br />
						You can link it here in the import form or in the run’s
						<code className="mx-1 bg-gray-100 px-1 py-0.5 rounded text-gray-700">
							meta_data.json
						</code>
						.
						<br />
					</span>
					<span className="font-medium text-gray-600">Precedence order:</span>
					<ol className="list-decimal list-inside mt-1 space-y-0.5">
						<li>Project specified in the import form</li>
						<li>
							Project specified in{' '}
							<code className="bg-gray-100 px-1 py-0.5 rounded text-gray-700">
								meta_data.json
							</code>
						</li>
					</ol>
				</p>

				<div className="flex flex-col gap-4">
					<div className="grid grid-cols-[1fr,min-content,min-content] gap-y-2 gap-x-2">
						{HEADER.map((label) => (
							<HeaderCell key={label}>{label}</HeaderCell>
						))}
						{fields.map((field, idx) => (
							<EditRow
								idx={idx}
								key={field.id}
								field={field}
								formApi={formControl}
								remove={remove}
							/>
						))}
					</div>
					<ButtonTw
						type="button"
						rounded="lg"
						size="md"
						variant="outline"
						onClick={() =>
							append({ url: '', force: false, range: null, project: null })
						}
					>
						<Icon name="AddSymbol" size={24} className="mr-1.5 text-primary" />
						<span>Add</span>
					</ButtonTw>
				</div>
				<div className="flex items-center gap-1">
					<Checkbox
						id="force-import"
						checked={allForceEnabled}
						onCheckedChange={handleGlobalForceChange}
						aria-label="Force import for all runs"
					/>
					<label htmlFor="force-import" className="text-sm font-medium">
						Force Import
					</label>
				</div>
				<div>
					<ButtonTw
						type="submit"
						rounded="lg"
						size="md"
						variant="primary"
						className="w-full"
					>
						{formControl.formState.isSubmitting ? (
							<Icon name="ProgressIndicator" className="pr-2" />
						) : null}
						{formControl.formState.isSubmitting
							? 'Importing...'
							: 'Start Import'}
					</ButtonTw>
				</div>
			</form>
		</>
	);
});

const HeaderCell = ({
	className,
	children,
	...props
}: ComponentPropsWithoutRef<'div'>) => {
	return (
		<div className={cn('grid items-center', className)} {...props}>
			<span className="text-xs font-bold tracking-wider uppercase">
				{children}
			</span>
		</div>
	);
};

const BodyCell = ({
	className,
	children,
	...props
}: ComponentPropsWithoutRef<'div'>) => {
	return (
		<div className={cn('grid items-center', className)} {...props}>
			{children}
		</div>
	);
};

type EditRowProps = {
	idx: number;
	field: UseFieldArrayReturn<ImportRunsFormValues>['fields'][number];
	remove: UseFieldArrayRemove;
	formApi: UseFormReturn<ImportRunsFormValues>;
};

const EditRow = ({ field, idx, formApi, remove }: EditRowProps) => {
	return (
		<Fragment key={field.id}>
			<BodyCell>
				<TextField
					control={formApi.control}
					name={`runs.${idx}.url`}
					placeholder={`https://ts-factory.io/logs/2022/11/14/fili-mcx5-${
						idx + 1
					}`}
					autoFocus={idx === 0}
				/>
			</BodyCell>
			<BodyCell>
				<AriaDateRangeField
					name={`runs.${idx}.range`}
					control={formApi.control}
					label="Range"
					hideLabel
				/>
			</BodyCell>
			<BodyCell className="grid place-items-center">
				{idx !== 0 ? (
					<Tooltip content="Delete row">
						<ButtonTw
							variant="outline"
							onClick={() => remove(idx)}
							className="grid rounded size-10 text-text-unexpected hover:bg-red-100 place-items-center"
						>
							<Icon name="CrossSimple" size={24} />
						</ButtonTw>
					</Tooltip>
				) : null}
			</BodyCell>
		</Fragment>
	);
};
