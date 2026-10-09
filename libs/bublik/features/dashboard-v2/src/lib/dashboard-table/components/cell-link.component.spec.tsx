/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import {
	afterAll,
	afterEach,
	beforeAll,
	describe,
	expect,
	it,
	vi
} from 'vitest';
import {
	RenderOptions,
	render as rtlRender,
	screen,
	fireEvent
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PropsWithChildren, ReactElement, forwardRef } from 'react';

import type { LinkWithProjectProps } from '@/bublik/features/projects';
import { joinTo, splitTarget } from '@/router';
import { TooltipProvider } from '@/shared/tailwind-ui';

import { CellLink } from './cell-link.component';

const render = (ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) =>
	rtlRender(ui, {
		wrapper: (props: PropsWithChildren) => (
			<TooltipProvider delayDuration={0}>{props.children}</TooltipProvider>
		),
		...options
	});

const navigateWithProjectMock = vi.fn();

vi.mock('@/bublik/features/projects', () => ({
	LinkWithProject: forwardRef<HTMLAnchorElement, LinkWithProjectProps>(
		// `state`, `replace` and `reloadDocument` are router options, not attributes.
		({ to, children, state, replace, reloadDocument, ...props }, ref) => (
			<a ref={ref} href={joinTo(splitTarget(to))} {...props}>
				{children}
			</a>
		)
	),
	useNavigateWithProject: () => navigateWithProjectMock
}));

describe('<CellLink />', () => {
	beforeAll(() => {
		vi.stubGlobal(
			'ResizeObserver',
			class {
				observe() {
					return undefined;
				}

				unobserve() {
					return undefined;
				}

				disconnect() {
					return undefined;
				}
			}
		);
	});

	afterAll(() => {
		vi.unstubAllGlobals();
	});

	afterEach(() => {
		navigateWithProjectMock.mockClear();
	});

	it('shows destination hint from payload context on hover', async () => {
		const user = userEvent.setup();

		render(
			<CellLink
				cellKey="total"
				data={{
					value: '7610',
					payload: { url: 'tree', params: 42 }
				}}
				hint="go to run tests as a tree with its logs and context"
			/>
		);

		await user.hover(screen.getByRole('link', { name: '7610' }));

		expect(await screen.findByRole('tooltip')).toHaveTextContent(
			'go to run tests as a tree with its logs and context'
		);
	});

	it('does not map destination hint when backend hint is missing', async () => {
		const user = userEvent.setup();

		render(
			<CellLink
				cellKey="configuration"
				data={{
					value: '7610',
					payload: { url: 'runs', params: 42 }
				}}
			/>
		);

		await user.hover(screen.getByRole('link', { name: '7610' }));

		expect(screen.queryByText('go to run details')).not.toBeInTheDocument();
		expect(
			screen.queryByText('go to run tests as a tree with its logs and context')
		).not.toBeInTheDocument();
	});

	it('keeps ctrl-click and regular click navigation behavior for unexpected links', async () => {
		const user = userEvent.setup();

		render(
			<CellLink
				cellKey="unexpected"
				data={{
					value: '31',
					payload: { url: 'runs', params: 42 }
				}}
			/>
		);

		const link = screen.getByRole('link', { name: '31' });

		await user.click(link);
		expect(navigateWithProjectMock).toHaveBeenCalledWith(
			'/runs/42',
			expect.objectContaining({
				state: expect.objectContaining({
					openUnexpected: true,
					openUnexpectedIntentId: expect.any(String)
				})
			})
		);

		fireEvent.click(link, { ctrlKey: true });
		expect(navigateWithProjectMock).toHaveBeenCalledWith(
			'/runs/42',
			expect.objectContaining({
				state: expect.objectContaining({
					openUnexpectedResults: true,
					openUnexpectedIntentId: expect.any(String)
				})
			})
		);
	});
});
