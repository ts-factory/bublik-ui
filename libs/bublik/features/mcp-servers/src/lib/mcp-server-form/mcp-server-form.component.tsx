/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET Labs Ltd. */
import { ComponentProps, forwardRef, useImperativeHandle } from 'react';
import { useFieldArray, useForm, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import {
	ButtonTw,
	Dialog,
	DialogClose,
	DialogDescription,
	DialogPortal,
	DialogTitle,
	DialogTrigger,
	FormAlertError,
	Icon,
	ModalContent,
	TextField
} from '@/shared/tailwind-ui';

import { McpServerFormSchema, McpServerFormValues } from './schema';

export type McpServerFormHandle = UseFormReturn<McpServerFormValues>;

const EMPTY_VALUES: McpServerFormValues = { name: '', url: '', headers: [] };

export interface McpServerFormProps {
	defaultValues?: McpServerFormValues;
	submitLabel: string;
	onSubmit?: (values: McpServerFormValues) => void;
}

export const McpServerForm = forwardRef<
	McpServerFormHandle,
	McpServerFormProps
>(({ defaultValues = EMPTY_VALUES, submitLabel, onSubmit }, ref) => {
	const form = useForm<McpServerFormValues>({
		defaultValues,
		resolver: zodResolver(McpServerFormSchema)
	});
	const headers = useFieldArray({ control: form.control, name: 'headers' });

	useImperativeHandle(ref, () => form, [form]);

	const headersError = form.formState.errors.headers?.message;

	return (
		<form
			onSubmit={form.handleSubmit((values) => onSubmit?.(values))}
			className="flex flex-col gap-4"
		>
			{form.formState.errors.root?.message ? (
				<div className="mb-2">
					<FormAlertError
						title="Error"
						description={form.formState.errors.root.message}
					/>
				</div>
			) : null}

			<TextField
				name="name"
				label="Name"
				placeholder="Jira"
				control={form.control}
			/>
			<TextField
				name="url"
				label="URL"
				placeholder="https://mcp.example.com/mcp"
				control={form.control}
			/>

			<fieldset className="flex flex-col gap-2">
				<legend className="mb-2 text-xs font-semibold tracking-wider uppercase text-text-menu">
					Headers
				</legend>
				<p className="text-xs text-text-menu">
					Sent with every request, e.g. an <code>Authorization</code> header.
					Values are stored encrypted and never shown again.
				</p>
				{headers.fields.map((field, index) => {
					const existing = form.getValues(`headers.${index}.existing`);

					return (
						<div key={field.id} className="flex items-start gap-2">
							<div className="flex-1">
								<TextField
									name={`headers.${index}.name`}
									label="Header name"
									placeholder="Authorization"
									autoComplete="off"
									readOnly={existing}
									control={form.control}
								/>
							</div>
							<div className="flex-1">
								<TextField
									name={`headers.${index}.value`}
									label="Value"
									type="password"
									autoComplete="off"
									placeholder={
										existing ? 'Leave blank to keep current value' : 'Bearer …'
									}
									control={form.control}
								/>
							</div>
							<button
								type="button"
								aria-label={`Remove header ${field.name || index + 1}`}
								onClick={() => headers.remove(index)}
								className="grid p-1.5 mt-7 transition-colors rounded-md place-items-center text-text-menu hover:bg-primary-wash hover:text-primary"
							>
								<Icon name="Cross" size={14} />
							</button>
						</div>
					);
				})}
				{headersError ? (
					<p className="text-xs text-text-unexpected">{headersError}</p>
				) : null}
				<div>
					<ButtonTw
						type="button"
						variant="outline"
						size="xss"
						onClick={() =>
							headers.append({ name: '', value: '', existing: false })
						}
					>
						Add header
					</ButtonTw>
				</div>
			</fieldset>

			<ButtonTw type="submit" variant="primary" size="md" className="mt-2">
				{submitLabel}
			</ButtonTw>
		</form>
	);
});

export type McpServerModalProps = ComponentProps<typeof McpServerForm> &
	Pick<ComponentProps<typeof Dialog>, 'open' | 'onOpenChange'> & {
		title: string;
		description: string;
		trigger: ComponentProps<typeof DialogTrigger>['children'];
	};

/**
 * The form in a dialog. Portalled and raised above the settings modal it
 * opens from, whose transform would otherwise contain and clip it.
 */
export const McpServerModal = forwardRef<
	McpServerFormHandle,
	McpServerModalProps
>(({ open, onOpenChange, title, description, trigger, ...props }, ref) => {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogTrigger asChild>{trigger}</DialogTrigger>
			<DialogPortal>
				<ModalContent
					overlayClassName="z-[60]"
					className="w-full sm:max-w-lg p-6 bg-white sm:rounded-lg md:shadow min-w-[420px] z-[70] relative overflow-auto max-h-[85vh]"
				>
					<DialogClose
						aria-label="Close"
						className="absolute grid p-1 transition-colors rounded-md right-4 top-4 place-items-center text-text-menu hover:bg-primary-wash hover:text-primary"
					>
						<Icon name="Cross" size={14} />
					</DialogClose>
					<DialogTitle className="mb-1 text-2xl font-bold leading-tight tracking-tight text-text-primary">
						{title}
					</DialogTitle>
					<DialogDescription className="mb-6 text-sm text-text-menu">
						{description}
					</DialogDescription>
					{open ? <McpServerForm {...props} ref={ref} /> : null}
				</ModalContent>
			</DialogPortal>
		</Dialog>
	);
});
