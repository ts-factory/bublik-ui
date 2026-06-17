/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { createRef } from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { Project } from '@/services/bublik-api';
import { Dialog, TooltipProvider } from '@/shared/tailwind-ui';

import {
	ImportRunForm,
	ImportRunFormHandle
} from './import-run-form.component';

const projects: Project[] = [{ id: 7, name: 'Project A' }];

beforeAll(() => {
	vi.stubGlobal(
		'ResizeObserver',
		class ResizeObserver {
			observe = () => undefined;
			unobserve = () => undefined;
			disconnect = () => undefined;
		}
	);
});

const setup = () => {
	const onImportRunsSubmit = vi.fn();
	const ref = createRef<ImportRunFormHandle>();
	const user = userEvent.setup();

	render(
		<TooltipProvider>
			<Dialog open>
				<ImportRunForm
					ref={ref}
					projects={projects}
					onImportRunsSubmit={onImportRunsSubmit}
				/>
			</Dialog>
		</TooltipProvider>
	);

	return { onImportRunsSubmit, ref, user };
};

describe('ImportRunForm', () => {
	it('preserves the selected project and force import when adding a URL row', async () => {
		const { onImportRunsSubmit, ref, user } = setup();

		act(() => {
			for (const index of [0, 1, 2, 3]) {
				ref.current?.form.setValue(`runs.${index}.project`, 7);
				ref.current?.form.setValue(`runs.${index}.force`, true);
			}
		});

		await waitFor(() => {
			expect(
				screen.getByRole('checkbox', { name: 'Force import for all runs' })
			).toHaveAttribute('aria-checked', 'true');
		});

		await user.click(screen.getByRole('button', { name: 'Add' }));

		const inputs = screen.getAllByTestId('input');
		await user.type(inputs[inputs.length - 1], 'https://example.test/run-5');
		await user.click(screen.getByRole('button', { name: 'Import' }));

		await waitFor(() => expect(onImportRunsSubmit).toHaveBeenCalledOnce());
		expect(onImportRunsSubmit).toHaveBeenCalledWith({
			runs: [
				{
					url: 'https://example.test/run-5',
					force: true,
					range: null,
					project: 7
				}
			]
		});
	});

	it('adds an unforced no-project row by default', async () => {
		const { onImportRunsSubmit, user } = setup();

		await user.click(screen.getByRole('button', { name: 'Add' }));

		const inputs = screen.getAllByTestId('input');
		await user.type(inputs[inputs.length - 1], 'https://example.test/run-5');
		await user.click(screen.getByRole('button', { name: 'Import' }));

		await waitFor(() => expect(onImportRunsSubmit).toHaveBeenCalledOnce());
		expect(onImportRunsSubmit).toHaveBeenCalledWith({
			runs: [
				{
					url: 'https://example.test/run-5',
					force: false,
					range: null,
					project: null
				}
			]
		});
	});
});
