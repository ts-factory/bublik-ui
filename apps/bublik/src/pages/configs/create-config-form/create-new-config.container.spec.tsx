/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import {
	forwardRef,
	type ButtonHTMLAttributes,
	type InputHTMLAttributes,
	type ReactNode
} from 'react';
import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { CreateNewConfigScreen } from './create-new-config.container';

const mocks = vi.hoisted(() => ({
	createConfig: vi.fn(),
	newConfigParams: { type: 'global', name: 'per_conf' },
	savedValue: undefined as string | undefined,
	setSavedValue: vi.fn()
}));

vi.mock('sonner', () => ({
	toast: { error: vi.fn(), promise: vi.fn() }
}));

vi.mock('@/bublik/features/analytics', () => ({
	analyticsEventNames: {
		configsLifecycleAction: 'configsLifecycleAction',
		configsCreateSubmit: 'configsCreateSubmit'
	},
	trackEvent: vi.fn()
}));

vi.mock('@/shared/hooks', () => ({
	useConfirm: () => ({
		confirmation: vi.fn(),
		confirm: vi.fn(),
		decline: vi.fn(),
		isVisible: false
	})
}));

vi.mock('@/services/bublik-api', () => ({
	bublikAPI: {
		useCreateConfigMutation: () => [mocks.createConfig, { isLoading: false }],
		useGetAllProjectsQuery: () => ({
			isLoading: false,
			data: [{ id: 7, name: 'Project Seven' }]
		}),
		useGetConfigSchemaQuery: () => ({ isLoading: false, data: {} })
	},
	ConfigExistsError: class ConfigExistsError extends Error {}
}));

vi.mock('@/shared/tailwind-ui', () => ({
	Input: forwardRef<
		HTMLInputElement,
		InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }
	>(({ label, error: _error, ...props }, ref) => (
		<label>
			{label}
			<input ref={ref} aria-label={label} {...props} />
		</label>
	)),
	cn: (...values: Array<string | false | null | undefined>) =>
		values.filter(Boolean).join(' '),
	Dialog: ({ open, children }: { open: boolean; children: ReactNode }) =>
		open ? children : null,
	DialogContent: ({ children }: { children: ReactNode }) => (
		<div>{children}</div>
	),
	dialogContentStyles: () => '',
	DialogOverlay: () => null,
	dialogOverlayStyles: () => '',
	Skeleton: () => <div>Loading</div>,
	Checkbox: () => null,
	ButtonTw: ({
		children,
		variant: _variant,
		size: _size,
		...props
	}: ButtonHTMLAttributes<HTMLButtonElement> & {
		variant?: string;
		size?: string;
	}) => <button {...props}>{children}</button>,
	Tooltip: ({ children }: { children: ReactNode }) => children,
	Icon: () => null,
	FormAlertError: () => null,
	ConfirmDialog: () => null
}));

vi.mock('@/shared/utils', () => ({ setErrorsOnForm: vi.fn() }));

vi.mock('../hooks', () => ({
	useConfigPageSearchParams: () => ({
		newConfigParams: mocks.newConfigParams,
		setConfigId: vi.fn()
	}),
	useSavedState: () => ({
		savedValue: mocks.savedValue,
		setSavedValue: mocks.setSavedValue,
		clearSavedValue: vi.fn()
	})
}));

vi.mock('../utils', async (importOriginal) => {
	const actual = await importOriginal<typeof import('../utils')>();

	return {
		...actual,
		getEditorValue: () => '{}',
		isValidJson: () => true
	};
});

vi.mock('../components/editor.component', () => ({
	ConfigEditor: forwardRef<unknown, { label: ReactNode }>(({ label }, _ref) => (
		<div>{label}</div>
	))
}));

function savedForm(name: string, project: number | null) {
	return JSON.stringify({
		name,
		description: '',
		is_active: true,
		project,
		content: '{}'
	});
}

async function openCreateDialog() {
	const user = userEvent.setup();
	render(<CreateNewConfigScreen />);
	await user.click(screen.getByRole('button', { name: 'Create' }));
	return user;
}

async function submitCreateDialog(user: ReturnType<typeof userEvent.setup>) {
	const submitButton = screen
		.getAllByRole('button', { name: 'Create' })
		.find((button) => button.getAttribute('type') === 'submit');

	expect(submitButton).toBeDefined();
	await user.click(submitButton as HTMLButtonElement);
}

afterEach(() => {
	cleanup();
	vi.clearAllMocks();
	mocks.newConfigParams = { type: 'global', name: 'per_conf' };
	mocks.savedValue = undefined;
	mocks.createConfig.mockReturnValue({
		unwrap: () => Promise.resolve({ id: 1 })
	});
});

describe('CreateNewConfigScreen project selection', () => {
	it('overrides a stale project in an AI global config draft', async () => {
		mocks.savedValue = savedForm('ai', 7);
		mocks.createConfig.mockReturnValue({
			unwrap: () => Promise.resolve({ id: 1 })
		});
		const user = await openCreateDialog();
		const project = screen.getByRole('combobox') as HTMLSelectElement;

		expect(project.disabled).toBe(true);
		expect(project.value).toBe('default');

		await submitCreateDialog(user);
		await waitFor(() => expect(mocks.createConfig).toHaveBeenCalledOnce());
		expect(mocks.createConfig.mock.calls[0][0].project).toBeNull();
	});

	it('locks and clears the project when a global config is renamed to ai', async () => {
		mocks.savedValue = savedForm('per_conf', 7);
		mocks.createConfig.mockReturnValue({
			unwrap: () => Promise.resolve({ id: 1 })
		});
		const user = await openCreateDialog();
		const project = screen.getByRole('combobox') as HTMLSelectElement;

		expect(project.disabled).toBe(false);
		expect(project.value).toBe('7');

		fireEvent.change(screen.getByRole('textbox', { name: 'Name' }), {
			target: { value: 'ai' }
		});

		await waitFor(() => expect(project.disabled).toBe(true));
		expect(project.value).toBe('default');

		await submitCreateDialog(user);
		await waitFor(() => expect(mocks.createConfig).toHaveBeenCalledOnce());
		expect(mocks.createConfig.mock.calls[0][0].project).toBeNull();
	});

	it('keeps project selection for non-AI configs', async () => {
		mocks.savedValue = savedForm('per_conf', null);
		mocks.createConfig.mockReturnValue({
			unwrap: () => Promise.resolve({ id: 1 })
		});
		const user = await openCreateDialog();
		const project = screen.getByRole('combobox') as HTMLSelectElement;

		expect(project.disabled).toBe(false);
		await user.selectOptions(project, '7');
		expect(project.value).toBe('7');

		await submitCreateDialog(user);
		await waitFor(() => expect(mocks.createConfig).toHaveBeenCalledOnce());
		expect(mocks.createConfig.mock.calls[0][0].project).toBe(7);
	});
});
