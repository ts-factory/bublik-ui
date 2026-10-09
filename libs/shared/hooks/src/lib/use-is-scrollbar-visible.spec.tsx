/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useIsScrollbarVisible } from '../index';

// jsdom has no layout: every element reads as overflowing, and the observers
// only need to exist.
beforeEach(() => {
	vi.stubGlobal(
		'ResizeObserver',
		class {
			observe = vi.fn();
			disconnect = vi.fn();
		}
	);
	vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockReturnValue(200);
	vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(100);
});

afterEach(() => {
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
});

/** A drawer rendered closed beside its button: the scroller comes later. */
function Drawer({ open }: { open: boolean }) {
	const [ref, isScrollable] = useIsScrollbarVisible<HTMLDivElement>();

	return (
		<>
			<span data-testid="scrollable">{String(isScrollable)}</span>
			{open ? <div ref={ref} /> : null}
		</>
	);
}

describe('useIsScrollbarVisible', () => {
	it('measures a scroller that mounts after the hook', () => {
		const { rerender } = render(<Drawer open={false} />);

		expect(screen.getByTestId('scrollable').textContent).toBe('false');

		rerender(<Drawer open />);

		expect(screen.getByTestId('scrollable').textContent).toBe('true');
	});
});
