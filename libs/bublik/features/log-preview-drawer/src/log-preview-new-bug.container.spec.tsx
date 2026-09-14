/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PropsWithChildren } from 'react';

import { TooltipProvider } from '@/shared/tailwind-ui';

import { NewBugContainer } from './log-preview-new-bug.container';

const { useGetRunDetailsQuery, useGetLogJsonQuery, useGetTreeByRunIdQuery } =
	vi.hoisted(() => ({
		useGetRunDetailsQuery: vi.fn(),
		useGetLogJsonQuery: vi.fn(),
		useGetTreeByRunIdQuery: vi.fn()
	}));

vi.mock('@/services/bublik-api', async (importOriginal) => {
	const actual = await importOriginal<typeof import('@/services/bublik-api')>();

	return {
		getErrorMessage: actual.getErrorMessage,
		useGetRunDetailsQuery,
		useGetLogJsonQuery,
		useGetTreeByRunIdQuery
	};
});

vi.mock('./new-bug.component', () => ({
	getBugProps: () => ({}),
	NewBugButton: () => <button data-testid="new-bug">New Bug</button>
}));

const Wrapper = (props: PropsWithChildren) => (
	<TooltipProvider delayDuration={0}>{props.children}</TooltipProvider>
);

const loading = { data: undefined, error: undefined };
const details = { data: { special_categories: {} }, error: undefined };
const tree = { data: { tree: {}, main_package: 1 }, error: undefined };
const notFound = {
	data: undefined,
	error: { status: 404, data: 'Tree for run 1 does not exist' }
};

function renderContainer() {
	return render(<NewBugContainer runId={1} resultId={2} />, {
		wrapper: Wrapper
	});
}

async function hoverForTooltip(button: HTMLElement) {
	fireEvent.pointerMove(button);

	return screen.findAllByText(/Can't build the bug report/);
}

describe('NewBugContainer', () => {
	beforeAll(() => {
		// Radix positions the tooltip with a ResizeObserver jsdom does not have.
		vi.stubGlobal(
			'ResizeObserver',
			class ResizeObserver {
				observe = () => undefined;
				unobserve = () => undefined;
				disconnect = () => undefined;
			}
		);
	});

	beforeEach(() => {
		useGetRunDetailsQuery.mockReturnValue(details);
		useGetLogJsonQuery.mockReturnValue(loading);
		useGetTreeByRunIdQuery.mockReturnValue(tree);
	});

	it('renders a disabled button with the error when the tree fails', async () => {
		useGetTreeByRunIdQuery.mockReturnValue(notFound);

		renderContainer();

		const button = screen.getByRole('button', { name: /new bug/i });
		expect(button).toBeDisabled();
		expect(screen.queryByTestId('new-bug')).not.toBeInTheDocument();

		const [hint] = await hoverForTooltip(button);
		expect(hint.textContent).toContain('failed to load run tree');
		expect(hint.textContent).toContain(
			'Not found: Tree for run 1 does not exist'
		);
	});

	it('disables the button when the log fails even though the rest loaded', async () => {
		useGetLogJsonQuery.mockReturnValue(notFound);

		renderContainer();

		const button = screen.getByRole('button', { name: /new bug/i });
		expect(button).toBeDisabled();

		const [hint] = await hoverForTooltip(button);
		expect(hint.textContent).toContain('failed to load log');
	});

	it('shows the spinner while the tree and details are still loading', () => {
		useGetRunDetailsQuery.mockReturnValue(loading);
		useGetTreeByRunIdQuery.mockReturnValue(loading);

		renderContainer();

		const button = screen.getByRole('button', { name: /new bug/i });
		expect(button).not.toBeDisabled();
		expect(button.querySelector('.animate-spin')).not.toBeNull();
		expect(screen.queryByTestId('new-bug')).not.toBeInTheDocument();
	});

	it('renders the real button once details and tree arrive, without waiting for the log', () => {
		renderContainer();

		expect(screen.getByTestId('new-bug')).toBeInTheDocument();
	});
});
