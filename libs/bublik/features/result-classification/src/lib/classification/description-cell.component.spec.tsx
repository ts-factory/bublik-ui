/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
	RenderOptions,
	render as rtlRender,
	screen,
	within
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PropsWithChildren, ReactElement, ReactNode, forwardRef } from 'react';

import { TooltipProvider } from '@/shared/tailwind-ui';

import {
	DescriptionBlock,
	DescriptionCell,
	overlayOffsets
} from './description-cell.component';

// Icons do not resolve under vitest. The cell renders the hover chevron and
// the key chip's tracker link; `SortArrow` is read at import time by the
// tailwind-ui barrel.
vi.mock('@/icons', () => {
	const icon = (name: string) => (props: Record<string, unknown>) =>
		<svg data-icon={name} {...props} />;

	return {
		ChevronDown: icon('ChevronDown'),
		ExternalLink: icon('ExternalLink'),
		SortArrow: icon('SortArrow')
	};
});

// The key chip links to the issue page; a plain anchor stands in for the
// project-aware router link.
vi.mock('@/bublik/features/projects', () => {
	interface MockLinkProps {
		to: string | { pathname?: string };
		children: ReactNode;
	}

	return {
		LinkWithProject: forwardRef<
			HTMLAnchorElement,
			MockLinkProps & Record<string, unknown>
		>(({ to, children, ...props }, ref) => (
			<a ref={ref} href={typeof to === 'string' ? to : to.pathname} {...props}>
				{children}
			</a>
		))
	};
});

// Pulled in by the badges module the key chip lives in; never rendered here.
vi.mock('../classify/classify-button.container', () => ({
	ClassifyButton: () => null
}));

const render = (ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) =>
	rtlRender(ui, {
		wrapper: (props: PropsWithChildren) => (
			<TooltipProvider delayDuration={0}>{props.children}</TooltipProvider>
		),
		...options
	});

const DESCRIPTION = [
	'Fails on `eth0` after reboot.',
	'',
	'See [the ticket](https://example.com/T-1).'
].join('\n');

const ISSUE = {
	title: 'Link flaps after reboot',
	bugKey: 'ref://bugz/NET-42',
	bugUrl: 'https://bugz.example.com/NET-42',
	issueId: 7
};

describe('DescriptionCell', () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('renders nothing without a description', () => {
		const { container, rerender } = render(
			<DescriptionCell {...ISSUE} value={null} />
		);
		expect(container).toBeEmptyDOMElement();

		rerender(<DescriptionCell {...ISSUE} value={'  \n '} />);
		expect(container).toBeEmptyDOMElement();
	});

	it('renders the one-line preview as markdown', () => {
		render(<DescriptionCell {...ISSUE} value={DESCRIPTION} />);

		const trigger = screen.getByTestId('description-cell');
		expect(trigger.querySelector('code')).toHaveTextContent('eth0');
		expect(trigger).not.toHaveTextContent('`');
		expect(screen.queryByTestId('description-popover')).not.toBeInTheDocument();
	});

	it('opens the full description on click, headed by the issue', async () => {
		render(<DescriptionCell {...ISSUE} value={DESCRIPTION} />);

		await userEvent.click(screen.getByTestId('description-cell'));

		const popover = await screen.findByTestId('description-popover');
		expect(within(popover).getByRole('heading')).toHaveTextContent(
			'Link flaps after reboot'
		);
		expect(within(popover).getByTestId('issue-key-link')).toHaveTextContent(
			'NET-42'
		);
		expect(within(popover).getByTestId('issue-bug-link')).toHaveAttribute(
			'href',
			'https://bugz.example.com/NET-42'
		);
		expect(within(popover).getByText('eth0').tagName).toBe('CODE');
		expect(
			within(popover).getByRole('link', { name: 'the ticket' })
		).toHaveAttribute('href', 'https://example.com/T-1');
		// Without `overlay` it opens beside the cell, where Radix puts it.
		expect(popover.style.translate).toBe('');
	});

	it("strikes a closed issue's key in the popover", async () => {
		render(<DescriptionCell {...ISSUE} value={DESCRIPTION} closed />);

		await userEvent.click(screen.getByTestId('description-cell'));

		const key = within(
			await screen.findByTestId('description-popover')
		).getByTestId('issue-key-link');
		expect(key).toHaveClass('line-through');
		expect(key).toHaveAttribute('data-issue-state', 'closed');
	});

	it('scrolls the text only, keeping the heading in view', async () => {
		render(<DescriptionCell {...ISSUE} value={DESCRIPTION} />);

		await userEvent.click(screen.getByTestId('description-cell'));

		const body = await screen.findByTestId('description-popover-body');
		expect(body).toHaveClass('overflow-auto');
		expect(within(body).queryByRole('heading')).not.toBeInTheDocument();
		expect(within(body).getByText('eth0')).toBeInTheDocument();
	});

	it('lays the popover over the line with `overlay`', async () => {
		vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(32);
		render(<DescriptionCell {...ISSUE} value={DESCRIPTION} overlay />);

		await userEvent.click(screen.getByTestId('description-cell'));

		// Placed by Radix's own offsets (see `overlayOffsets`), not a translate
		// on top of them, and shown once the header and anchor are measured.
		const popover = await screen.findByTestId('description-popover');
		expect(popover.style.translate).toBe('');
		expect(popover.style.visibility).not.toBe('hidden');
	});

	it('falls back to the issue id when no tracker key is linked', async () => {
		render(
			<DescriptionCell
				{...ISSUE}
				bugKey={null}
				bugUrl={null}
				value={DESCRIPTION}
			/>
		);

		await userEvent.click(screen.getByTestId('description-cell'));

		const popover = await screen.findByTestId('description-popover');
		expect(within(popover).getByTestId('issue-key-link')).toHaveTextContent(
			'#7'
		);
		expect(
			within(popover).queryByTestId('issue-bug-link')
		).not.toBeInTheDocument();
	});

	it('keeps headings and code blocks on the one line', () => {
		render(
			<DescriptionCell
				{...ISSUE}
				value={[
					'Unload hangs.',
					'',
					'## Symptom',
					'',
					'    [ 412.882] removing device',
					'    [ 442.113] task rmmod blocked'
				].join('\n')}
			/>
		);

		const trigger = screen.getByTestId('description-cell');
		expect(trigger.querySelector('h2, pre, p')).toBeNull();
		expect(trigger).toHaveTextContent('Symptom');
		expect(trigger).toHaveTextContent('task rmmod blocked');
	});
});

describe('DescriptionBlock', () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	// jsdom has no layout, so every height reads 0; give the content more
	// height than its box to stand in for a description past the cap.
	const clipContent = () => {
		vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockReturnValue(200);
		vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(108);
		// The overlay popover stays hidden until its header has a height.
		vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(32);
	};

	it('shows a description that fits as is, links and all', () => {
		render(<DescriptionBlock {...ISSUE} value={DESCRIPTION} />);

		const block = screen.getByTestId('description-block');
		expect(block.tagName).toBe('DIV');
		expect(
			within(block).getByRole('link', { name: 'the ticket' })
		).toHaveAttribute('href', 'https://example.com/T-1');
		expect(screen.queryByRole('button')).not.toBeInTheDocument();
	});

	it('opens a description cut at the cap in the popover', async () => {
		clipContent();
		render(<DescriptionBlock {...ISSUE} value={DESCRIPTION} overlay />);

		const block = screen.getByTestId('description-block');
		expect(block.tagName).toBe('BUTTON');

		await userEvent.click(block);

		const popover = await screen.findByTestId('description-popover');
		expect(within(popover).getByRole('heading')).toHaveTextContent(
			'Link flaps after reboot'
		);
		expect(
			within(popover).getByRole('link', { name: 'the ticket' })
		).toHaveAttribute('href', 'https://example.com/T-1');
		// Laid over the text by Radix's own offsets, so it stays on screen.
		expect(popover.style.translate).toBe('');
		expect(popover.style.visibility).not.toBe('hidden');
	});
});

describe('overlayOffsets', () => {
	it('lifts the popover text onto the anchor text', () => {
		// Up by the 32px anchor, a 32px header and the 21px above the text; left
		// by the 12px the text sits in from the popover's edge.
		expect(overlayOffsets(32, 32)).toEqual({
			sideOffset: -85,
			alignOffset: -12
		});
	});
});
