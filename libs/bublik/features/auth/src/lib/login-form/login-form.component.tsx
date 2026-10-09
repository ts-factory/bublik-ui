/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { forwardRef, ReactNode, useImperativeHandle } from 'react';
import { useForm, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from '@tanstack/react-router';

import { ButtonTw, FormAlertError, TextField } from '@/shared/tailwind-ui';
import { LoginFormInputs, LoginFormSchema } from '@/shared/types';

import { AuthFormLayout } from '../auth-form-layout';

export type LoginFormHandle = UseFormReturn<LoginFormInputs>;

/** No `active` class on the recovery link, as with `RouterLink`. */
const NO_ACTIVE_PROPS = {};

type LoginFormProps = {
	onSubmit?: (form: LoginFormInputs) => void;
	defaultValues?: LoginFormInputs;
	/** Render only the form, without the page card, e.g. inside a dialog. */
	bare?: boolean;
	onForgotPasswordClick?: () => void;
	/** Shown left of the submit button, e.g. a way back out of a dialog. */
	secondaryAction?: ReactNode;
};

export const LoginForm = forwardRef<LoginFormHandle, LoginFormProps>(
	(props, ref) => {
		const {
			onSubmit,
			defaultValues = { email: '', password: '' },
			bare = false,
			onForgotPasswordClick,
			secondaryAction
		} = props;

		const form = useForm<LoginFormInputs>({
			defaultValues,
			resolver: zodResolver(LoginFormSchema)
		});

		useImperativeHandle(ref, () => form, [form]);

		const rootError = form.formState.errors.root;

		const submitButton = (
			<ButtonTw
				type="submit"
				disabled={form.formState.isSubmitting}
				className={secondaryAction ? 'flex-1' : undefined}
			>
				{form.formState.isLoading ? '...' : 'Sign In'}
			</ButtonTw>
		);

		const content = (
			<>
				{rootError ? (
					<div className="mb-6">
						<FormAlertError title={'Error'} description={rootError.message} />
					</div>
				) : null}
				<form
					className="flex flex-col gap-6"
					onSubmit={form.handleSubmit((form) => onSubmit?.(form))}
				>
					<TextField
						name="email"
						label="Email"
						placeholder="Email"
						control={form.control}
					/>
					<TextField
						name="password"
						label="Password"
						placeholder="Password"
						type="password"
						control={form.control}
					/>
					<div className="flex items-center justify-end">
						<Link
							to="/auth/forgot"
							// The pages scroll their own containers
							resetScroll={false}
							activeProps={NO_ACTIVE_PROPS}
							onClick={onForgotPasswordClick}
							className="text-sm font-medium text-primary hover:underline"
						>
							Forgot password?
						</Link>
					</div>
					{secondaryAction ? (
						<div className="flex gap-3">
							{secondaryAction}
							{submitButton}
						</div>
					) : (
						submitButton
					)}
				</form>
			</>
		);

		if (bare) return content;

		return (
			<AuthFormLayout label="Sign in to your account">{content}</AuthFormLayout>
		);
	}
);
