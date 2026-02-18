/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { render } from '@testing-library/react';
import { UseFormReturn } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';

import {
	HistoryGlobalSearchFormValues,
	defaultValues
} from './global-search-form.types';
import { useCtrlEnterSubmit } from './global-search-form.hooks';

type HookHostProps = {
	methods: UseFormReturn<HistoryGlobalSearchFormValues, unknown>;
	onSubmit: (form: HistoryGlobalSearchFormValues) => void;
};

const HookHost = (props: HookHostProps) => {
	useCtrlEnterSubmit({ methods: props.methods, onSubmit: props.onSubmit });

	return null;
};

const createMethodsMock = () => {
	const methods = {
		handleSubmit: vi.fn((callback) => () => callback(defaultValues))
	} as unknown as UseFormReturn<HistoryGlobalSearchFormValues, unknown>;

	return methods;
};

describe('useCtrlEnterSubmit', () => {
	it('does not submit on Enter without modifiers', () => {
		const onSubmit = vi.fn();
		const methods = createMethodsMock();

		render(<HookHost methods={methods} onSubmit={onSubmit} />);

		document.dispatchEvent(
			new KeyboardEvent('keydown', {
				key: 'Enter',
				bubbles: true,
				cancelable: true
			})
		);

		expect(methods.handleSubmit).not.toHaveBeenCalled();
		expect(onSubmit).not.toHaveBeenCalled();
	});

	it('submits on Ctrl + Enter', () => {
		const onSubmit = vi.fn();
		const methods = createMethodsMock();

		render(<HookHost methods={methods} onSubmit={onSubmit} />);

		document.dispatchEvent(
			new KeyboardEvent('keydown', {
				key: 'Enter',
				ctrlKey: true,
				bubbles: true,
				cancelable: true
			})
		);

		expect(methods.handleSubmit).toHaveBeenCalledOnce();
		expect(onSubmit).toHaveBeenCalledWith(defaultValues);
	});

	it('submits on Cmd + Enter', () => {
		const onSubmit = vi.fn();
		const methods = createMethodsMock();

		render(<HookHost methods={methods} onSubmit={onSubmit} />);

		document.dispatchEvent(
			new KeyboardEvent('keydown', {
				key: 'Enter',
				metaKey: true,
				bubbles: true,
				cancelable: true
			})
		);

		expect(methods.handleSubmit).toHaveBeenCalledOnce();
		expect(onSubmit).toHaveBeenCalledWith(defaultValues);
	});
});
