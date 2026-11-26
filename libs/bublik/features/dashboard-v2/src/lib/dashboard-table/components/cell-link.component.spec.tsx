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
	fireEvent,
	within
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PropsWithChildren, ReactElement, ReactNode, forwardRef } from 'react';

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

vi.mock('@/bublik/features/projects', () => {
	interface MockLinkWithProjectProps {
		to: string | { pathname?: string };
		children: ReactNode;
	}

	return {
		LinkWithProject: forwardRef<
			HTMLAnchorElement,
			MockLinkWithProjectProps & Record<string, unknown>
		>(({ to, children, ...props }, ref) => {
			const href = typeof to === 'string' ? to : to?.pathname || '#';

			return (
				<a href={href} ref={ref} {...props}>
					{children}
				</a>
			);
		}),
		useNavigateWithProject: () => navigateWithProjectMock
	};
});

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
		vi.restoreAllMocks();
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

	/**
	 * Makes the badge measure as the column cutting it with an ellipsis. jsdom
	 * lays nothing out, and the card stays hidden until it has heights to place
	 * itself by, so every element gets one.
	 */
	const cut = (badge: HTMLElement) => {
		Object.defineProperty(badge, 'scrollWidth', { value: 140 });
		Object.defineProperty(badge, 'clientWidth', { value: 100 });
		vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(22);
	};

	it('shows a cut badge whole on hover, in a card with its link in the header', async () => {
		const user = userEvent.setup();

		render(
			<CellLink
				cellKey="Configuration"
				data={{
					value: 'mcp-write-tools',
					payload: { url: 'runs', params: 42 }
				}}
				hint="Go to Run"
				heading="Deploy"
			/>
		);

		const link = screen.getByRole('link', { name: 'mcp-write-tools' });
		cut(link);
		await user.hover(link);

		const card = within(await screen.findByTestId('dashboard-cell-card'));

		expect(card.getByRole('heading', { name: 'Deploy' })).toBeInTheDocument();
		// The value keeps the badge's link, and the header repeats it.
		expect(card.getByRole('link', { name: 'mcp-write-tools' })).toHaveAttribute(
			'href',
			'/runs/42'
		);
		expect(card.getByRole('link', { name: 'Go to Run' })).toHaveAttribute(
			'href',
			'/runs/42'
		);
		// The card stands in for the tooltip, it does not join it.
		expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
	});

	it('shows a cut badge that is not a link whole on hover, without a link', async () => {
		const user = userEvent.setup();

		render(
			<CellLink
				cellKey="Lab"
				data={{ value: 'lab-host-with-a-name' }}
				heading="Lab"
			/>
		);

		const badge = screen.getByText('lab-host-with-a-name');
		cut(badge);
		await user.hover(badge);

		const card = within(await screen.findByTestId('dashboard-cell-card'));

		expect(card.getByText('lab-host-with-a-name')).toBeInTheDocument();
		expect(card.queryByRole('link')).not.toBeInTheDocument();
	});

	it('shows no card for a badge that fits', async () => {
		const user = userEvent.setup();

		render(
			<CellLink
				cellKey="Configuration"
				data={{ value: 'ui-681', payload: { url: 'runs', params: 42 } }}
				hint="Go to Run"
				heading="Deploy"
			/>
		);

		await user.hover(screen.getByRole('link', { name: 'ui-681' }));

		expect(await screen.findByRole('tooltip')).toHaveTextContent('Go to Run');
		expect(screen.queryByTestId('dashboard-cell-card')).not.toBeInTheDocument();
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
