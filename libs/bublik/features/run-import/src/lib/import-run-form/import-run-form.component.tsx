/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import {
	ComponentPropsWithoutRef,
	Fragment,
	useCallback,
	useEffect
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

import {
	AriaDateRangeField,
	ButtonTw,
	CheckboxField,
	cn,
	DialogDescription,
	DialogTitle,
	Icon,
	TextField,
	toast,
	Tooltip
} from '@/shared/tailwind-ui';
import { ImportRunsFormSchema, ImportRunsFormValues } from '@/shared/types';

import { stringToArray } from './import-run-form.utils';

export interface ImportRunFormProps {
	onImportRunsSubmit?: (values: ImportRunsFormValues) => void;
}

const defaultValues: ImportRunsFormValues = {
	runs: [{ url: '', force: null, range: null }]
};

export const ImportRunForm = ({ onImportRunsSubmit }: ImportRunFormProps) => {
	const formControl = useForm<ImportRunsFormValues>({
		defaultValues,
		resolver: zodResolver(ImportRunsFormSchema)
	});

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

	const HEADER = ['URL', 'RANGE', 'FORCE', ''];

	return (
		<div>
			<DialogTitle className="text-lg font-medium leading-6 text-gray-900">
				Import runs
			</DialogTitle>
			<DialogDescription className="mt-2 mb-6 text-sm font-normal text-gray-700">
				You can <strong>paste</strong> URLs of runs you want to import. <br />
				URLs should be separated by a <strong>new line</strong> or{' '}
				<strong>space</strong>.
			</DialogDescription>
			<form
				className="flex flex-col gap-4 mt-2"
				onSubmit={formControl.handleSubmit((form) =>
					onImportRunsSubmit?.({
						...form,
						runs: form.runs.filter((v) => v.url)
					})
				)}
			>
				<div className="flex flex-col gap-4">
					<div className="grid grid-cols-[1fr,min-content,min-content,min-content] gap-y-2 gap-x-4">
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
						onClick={() => append({ url: '', force: false, range: null })}
					>
						Add URL
					</ButtonTw>
				</div>

				<div className="mt-4">
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
		</div>
	);
};

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
					placeholder={`Url ${idx + 1}`}
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
				<CheckboxField name={`runs.${idx}.force`} control={formApi.control} />
			</BodyCell>
			<BodyCell className="grid place-items-center">
				<Tooltip content="Delete row">
					<button
						onClick={() => remove(idx)}
						className="grid p-0 rounded text-text-unexpected hover:bg-red-100 place-items-center"
					>
						<Icon name="CrossSimple" size={24} />
					</button>
				</Tooltip>
			</BodyCell>
		</Fragment>
	);
};
