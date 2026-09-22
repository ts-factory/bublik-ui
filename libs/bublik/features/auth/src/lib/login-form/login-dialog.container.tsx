/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { useRef, useSyncExternalStore } from 'react';
import { useDispatch } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { AnyAction } from '@reduxjs/toolkit';

import { routes } from '@/router';
import { useNavigateWithProject } from '@/bublik/features/projects';
import { LoginFormInputs } from '@/shared/types';
import {
	bublikAPI,
	getLoginPrompt,
	LoginPromptReason,
	resolveLogin,
	subscribeLoginPrompt,
	useLoginMutation
} from '@/services/bublik-api';
import { setErrorsOnForm } from '@/shared/utils';
import {
	ButtonTw,
	Dialog,
	DialogClose,
	DialogDescription,
	DialogPortal,
	DialogTitle,
	Icon,
	ModalContent,
	toast
} from '@/shared/tailwind-ui';

import { LoginForm, LoginFormHandle } from './login-form.component';

function getNote(reason: LoginPromptReason, pathname: string): string | null {
	if (reason.message) return reason.message;

	if (reason.kind === 'manual') return null;

	if (reason.kind === 'action') return 'You need to sign in to do this.';

	return pathname.startsWith('/admin')
		? 'To view this page you need to sign in as an admin.'
		: 'To view this page you need to sign in.';
}

/**
 * Asks for credentials when a request was rejected as "Not Authenticated".
 * On success the rejected requests are retried by the base query, so the user
 * stays on the page they were on.
 *
 * Dismissing it depends on what asked:
 * - a page that could not load: go back where the user came from
 * - an action: just close, the page stays usable
 */
export function LoginDialogContainer() {
	const reason = useSyncExternalStore(subscribeLoginPrompt, getLoginPrompt);
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const navigateWithProject = useNavigateWithProject();
	const { pathname } = useLocation();
	const note = reason ? getNote(reason, pathname) : null;
	const isPagePrompt = reason?.kind === 'page';
	// `idx` is React Router's position in its own history stack
	const canGoBack = (window.history.state?.idx ?? 0) > 0;
	const [login] = useLoginMutation();
	const formRef = useRef<LoginFormHandle>(null);

	const handleSubmit = async (form: LoginFormInputs) => {
		if (!formRef.current) return;
		const formHandle = formRef.current;

		try {
			const { user } = await login(form).unwrap();

			dispatch(
				bublikAPI.util.upsertQueryData('me', undefined, {
					...user
				}) as unknown as AnyAction
			);

			resolveLogin(true);
		} catch (e: unknown) {
			toast.error('Failed to login!');
			setErrorsOnForm(e, { handle: formHandle });
		}
	};

	const handleDismiss = () => {
		const kind = reason?.kind;

		resolveLogin(false);

		if (kind !== 'page') return;

		if (canGoBack) navigate(-1);
		// Keeps the sidebar state and the selected project, like the sidebar links
		else navigateWithProject(routes.dashboard({}), { replace: true });
	};

	return (
		<Dialog
			open={reason !== null}
			onOpenChange={(isOpen) => {
				if (!isOpen) handleDismiss();
			}}
		>
			<DialogPortal>
				<ModalContent
					data-testid="login-dialog"
					// A page prompt leaves the page when dismissed, so only the explicit
					// "Go back" (or Escape) does that, never a stray backdrop click
					onInteractOutside={
						isPagePrompt ? (event) => event.preventDefault() : undefined
					}
					className="w-full sm:max-w-md p-6 bg-white sm:rounded-lg md:shadow min-w-[420px] z-50 relative overflow-auto max-h-[85vh]"
				>
					{!isPagePrompt ? (
						<DialogClose
							aria-label="Close"
							className="absolute grid p-1 transition-colors rounded-md right-4 top-4 place-items-center text-text-menu hover:bg-primary-wash hover:text-primary"
						>
							<Icon name="Cross" size={14} />
						</DialogClose>
					) : null}
					<DialogTitle className="mb-4 text-2xl font-bold leading-tight tracking-tight text-text-primary">
						Sign In
					</DialogTitle>
					{note ? (
						<DialogDescription className="flex items-start gap-2 p-3 mb-6 text-sm rounded-md bg-primary-wash text-primary">
							<Icon
								name="InformationCircleExclamationMark"
								size={20}
								className="shrink-0"
							/>
							<span>{note}</span>
						</DialogDescription>
					) : null}
					<LoginForm
						ref={formRef}
						bare
						onSubmit={handleSubmit}
						onForgotPasswordClick={() => resolveLogin(false)}
						secondaryAction={
							isPagePrompt ? (
								<ButtonTw
									type="button"
									variant="secondary"
									className="flex-1"
									onClick={handleDismiss}
								>
									<Icon
										name="ArrowShortTop"
										size={16}
										className="mr-1.5 -rotate-90"
									/>
									{canGoBack ? 'Go back' : 'Go to dashboard'}
								</ButtonTw>
							) : null
						}
					/>
				</ModalContent>
			</DialogPortal>
		</Dialog>
	);
}
