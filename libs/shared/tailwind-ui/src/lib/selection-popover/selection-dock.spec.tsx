/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { act, fireEvent, render, screen, within } from '@testing-library/react';

import { SelectionDockProvider } from './selection-dock';
import {
	SelectionPopover,
	SelectionPopoverBody,
	SelectionPopoverFloatingButton
} from './selection-popover';

interface SelectionProps {
	name: string;
	initiallyOpen?: boolean;
	raised?: boolean;
	dockOrder?: number;
}

function Selection({
	name,
	initiallyOpen = false,
	raised,
	dockOrder
}: SelectionProps) {
	const [open, setOpen] = useState(initiallyOpen);

	return (
		<SelectionPopover
			open={open}
			onOpenChange={setOpen}
			raised={raised}
			dockOrder={dockOrder}
		>
			<SelectionPopoverFloatingButton label={`${name} selected`} />
			<SelectionPopoverBody>{`Selected ${name}`}</SelectionPopoverBody>
		</SelectionPopover>
	);
}

function dock() {
	return screen.getByTestId('selection-dock');
}

describe('SelectionDockProvider', () => {
	it('stacks every selection pill in the one dock', () => {
		render(
			<SelectionDockProvider>
				<Selection name="4 results" />
				<Selection name="2 runs" dockOrder={1} />
			</SelectionDockProvider>
		);

		const items = within(dock()).getAllByTestId('selection-dock-item');

		expect(items).toHaveLength(2);
		expect(
			within(dock()).getByRole('button', { name: '4 results selected' })
		).toBeInTheDocument();
		expect(
			within(dock()).getByRole('button', { name: '2 runs selected' })
		).toBeInTheDocument();
		expect(items[1]).toHaveStyle({ order: '1' });
	});

	it('keeps one panel open: opening one closes the other', () => {
		render(
			<SelectionDockProvider>
				<Selection name="4 results" initiallyOpen />
				<Selection name="2 runs" />
			</SelectionDockProvider>
		);

		expect(screen.getByText('Selected 4 results')).toBeInTheDocument();

		fireEvent.click(screen.getByRole('button', { name: '2 runs selected' }));

		expect(screen.getByText('Selected 2 runs')).toBeInTheDocument();
		expect(
			screen.getByRole('button', { name: '4 results selected' })
		).toHaveAttribute('aria-expanded', 'false');

		fireEvent.click(screen.getByRole('button', { name: '4 results selected' }));

		expect(
			screen.getByRole('button', { name: '2 runs selected' })
		).toHaveAttribute('aria-expanded', 'false');
		expect(
			screen.getByRole('button', { name: '4 results selected' })
		).toHaveAttribute('aria-expanded', 'true');
	});

	it('lets the latest selection to open, on mount too, keep its panel', () => {
		function Page() {
			const [picked, setPicked] = useState(false);

			return (
				<>
					<button onClick={() => setPicked(true)}>Pick</button>
					<Selection name="2 runs" initiallyOpen />
					{picked ? <Selection name="1 result" initiallyOpen /> : null}
				</>
			);
		}

		render(
			<SelectionDockProvider>
				<Page />
			</SelectionDockProvider>
		);

		act(() => {
			fireEvent.click(screen.getByRole('button', { name: 'Pick' }));
		});

		expect(
			screen.getByRole('button', { name: '1 result selected' })
		).toHaveAttribute('aria-expanded', 'true');
		expect(
			screen.getByRole('button', { name: '2 runs selected' })
		).toHaveAttribute('aria-expanded', 'false');
	});

	it('lifts the dock while a raised selection is in it', () => {
		const { rerender } = render(
			<SelectionDockProvider>
				<Selection name="4 results" raised />
			</SelectionDockProvider>
		);

		expect(dock()).toHaveClass('bottom-16');

		rerender(<SelectionDockProvider>{null}</SelectionDockProvider>);

		expect(dock()).toHaveClass('bottom-4');
	});

	it('docks a selection alone outside a provider', () => {
		render(<Selection name="4 results" />);

		expect(screen.getByTestId('selection-dock-item')).toBeInTheDocument();
		expect(
			screen.getByRole('button', { name: '4 results selected' })
		).toBeInTheDocument();
	});
});
