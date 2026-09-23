/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET Labs Ltd. */
import { ComponentProps, forwardRef, useImperativeHandle } from 'react';
import { useForm, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import {
	CreateAccessTokenInputs,
	CreateAccessTokenSchema
} from '@/shared/types';
import {
	ButtonTw,
	cn,
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

export type CreateTokenFormHandle = UseFormReturn<CreateAccessTokenInputs>;

/** Mirrors the fixed set the API accepts; null means the token never expires. */
const EXPIRY_OPTIONS: { label: string; value: 7 | 30 | 90 | null }[] = [
	{ label: '7 days', value: 7 },
	{ label: '30 days', value: 30 },
	{ label: '90 days', value: 90 },
	{ label: 'Never', value: null }
];

export interface CreateTokenFormProps {
	onSubmit?: (input: CreateAccessTokenInputs) => void;
}

export const CreateTokenForm = forwardRef<
	CreateTokenFormHandle,
	CreateTokenFormProps
>((props, ref) => {
	const { onSubmit } = props;

	const form = useForm<CreateAccessTokenInputs>({
		defaultValues: { name: '', expires_in: 30 },
		resolver: zodResolver(CreateAccessTokenSchema)
	});

	useImperativeHandle(ref, () => form, [form]);

	const expiresIn = form.watch('expires_in');

	return (
		<form
			onSubmit={form.handleSubmit((input) => onSubmit?.(input))}
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
				placeholder="code-laptop"
				control={form.control}
			/>

			<fieldset className="flex flex-col gap-2">
				<legend className="mb-2 text-xs font-semibold tracking-wider uppercase text-text-menu">
					Expires
				</legend>
				<div className="flex flex-wrap gap-2">
					{EXPIRY_OPTIONS.map((option) => (
						<button
							key={option.label}
							type="button"
							aria-pressed={expiresIn === option.value}
							onClick={() =>
								form.setValue('expires_in', option.value, {
									shouldDirty: true
								})
							}
							className={cn(
								'rounded-md border px-3 py-1.5 text-sm transition-colors',
								expiresIn === option.value
									? 'border-primary bg-primary-wash text-primary font-semibold'
									: 'border-border-primary text-text-menu hover:bg-primary-wash'
							)}
						>
							{option.label}
						</button>
					))}
				</div>
				{expiresIn === null ? (
					<p className="mt-1 text-xs text-text-menu">
						A token that never expires keeps working until you revoke it.
					</p>
				) : null}
			</fieldset>

			<ButtonTw type="submit" variant="primary" size="md" className="mt-2">
				Create token
			</ButtonTw>
		</form>
	);
});

export type CreateTokenModalProps = ComponentProps<typeof CreateTokenForm> &
	Pick<ComponentProps<typeof Dialog>, 'open' | 'onOpenChange'>;

export const CreateTokenModal = forwardRef<
	CreateTokenFormHandle,
	CreateTokenModalProps
>(({ open, onOpenChange, ...props }, ref) => {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogTrigger asChild>
				<ButtonTw variant="primary" size="xs">
					New token
				</ButtonTw>
			</DialogTrigger>
			{/* Portalled for the same reason as the reveal dialog: the settings
			    modal's transform would otherwise contain and clip it. */}
			<DialogPortal>
				<ModalContent
					/* Above the settings modal this opens from. */
					overlayClassName="z-[60]"
					className="w-full sm:max-w-md p-6 bg-white sm:rounded-lg md:shadow min-w-[420px] z-[70] relative overflow-auto max-h-[85vh]"
				>
					<DialogClose
						aria-label="Close"
						className="absolute grid p-1 transition-colors rounded-md right-4 top-4 place-items-center text-text-menu hover:bg-primary-wash hover:text-primary"
					>
						<Icon name="Cross" size={14} />
					</DialogClose>
					<DialogTitle className="mb-1 text-2xl font-bold leading-tight tracking-tight text-text-primary">
						New access token
					</DialogTitle>
					<DialogDescription className="mb-6 text-sm text-text-menu">
						The token acts as you, with your permissions. Its value is shown
						once.
					</DialogDescription>
					<CreateTokenForm {...props} ref={ref} />
				</ModalContent>
			</DialogPortal>
		</Dialog>
	);
});
