/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { renderWithRouter } from '@/router/testing';
import { TooltipProvider } from '@/shared/tailwind-ui';

import { DiffFormContainer } from './diff-form.container';

async function submitFrom(rightRunId: string) {
	const user = userEvent.setup();
	const { router } = await renderWithRouter(
		<TooltipProvider>
			<DiffFormContainer defaultValues={{ leftRunId: '1132' }} />
		</TooltipProvider>,
		{ path: '/runs/1132', search: 'expanded=abc&_s=xyz&project=7' }
	);
	const length = router.history.length;

	await user.click(screen.getByRole('button', { name: 'Compare' }));
	await user.type(await screen.findByLabelText('Right Run'), rightRunId);
	// The open popover hides the trigger: the one "Compare" left submits.
	await user.click(screen.getByRole('button', { name: 'Compare' }));

	return { router, length };
}

describe('<DiffFormContainer />', () => {
	it('pushes /compare with both run ids, carrying the sidebar state and projects', async () => {
		const { router, length } = await submitFrom('1151');

		await waitFor(() =>
			expect(router.history.location.href).toBe(
				'/v2/compare?left=1132&right=1151&_s=xyz&project=7'
			)
		);
		expect(router.history.length).toBe(length + 1);
	});

	it('takes the run id of a pasted run page URL', async () => {
		const { router } = await submitFrom('https://bublik.example/v2/runs/1151/');

		await waitFor(() =>
			expect(router.history.location.pathname).toBe('/v2/compare')
		);
		expect(router.history.location.search).toBe(
			'?left=1132&right=1151&_s=xyz&project=7'
		);
	});
});
