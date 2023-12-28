/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import React, { ReactNode } from 'react';

import { useCopyToClipboard } from '@/shared/hooks';
import { toast } from '../utils';

import { ButtonTw } from '../button';
import { ErrorPage } from '../error-page';
import { Icon } from '../icon';

type ErrorHandlerProps = {
	error: unknown;
};

function ErrorMessage({ error }: ErrorHandlerProps) {
	const [, copy] = useCopyToClipboard({
		onSuccess: () => toast.success('Successfully copied error to clipboard')
	});

	if (error instanceof Error) {
		return (
			<div className="relative self-stretch w-full p-2 rounded-lg bg-bg-fillError/50">
				<button
					className="absolute p-1 transition-colors rounded hover:bg-primary-wash right-4 top-4"
					onClick={() =>
						copy(`${error.name}\n${error.message}\n${error.stack}`)
					}
				>
					<Icon name="PaperStack" size={24} />
				</button>
				<h2 className="text-text-primary">{error.name}</h2>
				<h2 className="text-text-primary">{error.message}</h2>
				<pre className="mt-4 text-sm text-text-secondary">{error.stack}</pre>
			</div>
		);
	}

	return (
		<div className="relative self-stretch w-full p-2 rounded-lg bg-bg-fillError/50">
			Something went wrong... <br />
			We don't know exactly what went. <br />
			Please, report
		</div>
	);
}

export interface ResetStateProps {
	error: unknown;
	onGoBackClick?: () => void;
	onReloadClick?: () => void;
}
export const ResetState = ({
	onGoBackClick,
	onReloadClick,
	error
}: ResetStateProps) => {
	const handleGoBackClick = () => onGoBackClick?.();
	const handleReloadClick = () => onReloadClick?.();

	return (
		<ErrorPage
			label="Something went wrong"
			error={<ErrorMessage error={error} />}
			message={
				<>
					Try reloading the page. <br />
					If error persists, please contact administrator
				</>
			}
			actions={
				<>
					<ButtonTw
						variant="primary"
						size="md"
						rounded="lg"
						className="w-full"
						onClick={handleReloadClick}
					>
						Reload
					</ButtonTw>
					<ButtonTw
						variant="outline"
						className="w-full"
						size="md"
						rounded="lg"
						onClick={handleGoBackClick}
					>
						Go back
					</ButtonTw>
				</>
			}
		/>
	);
};

export interface ErrorBoundaryProps {
	children?: ReactNode;
}

export interface ErrorBoundaryState {
	error?: unknown;
}

export class ErrorBoundary extends React.Component<
	ErrorBoundaryProps,
	ErrorBoundaryState
> {
	constructor(props: ErrorBoundaryProps) {
		super(props);
		this.state = {};
	}

	static getDerivedStateFromError(error: unknown) {
		// Update state so the next render will show the fallback UI.
		return { error };
	}

	override componentDidCatch(error: unknown, errorInfo: unknown) {
		// You can also log the error to an error reporting service
		// logErrorToMyService(error, errorInfo);
	}

	resetError = () => {
		this.setState({ error: undefined });
	};

	handleReloadClick = () => {
		this.resetError();
		window.history.go(0);
	};

	handleGoBackClick = () => {
		this.resetError();
		window.history.back();
		setTimeout(() => window.history.go(0), 250);
	};

	override render() {
		if (this.state.error) {
			// You can render any custom fallback UI
			return (
				<ResetState
					error={this.state.error}
					onGoBackClick={this.handleGoBackClick}
					onReloadClick={this.handleReloadClick}
				/>
			);
		}

		return this.props.children;
	}
}
