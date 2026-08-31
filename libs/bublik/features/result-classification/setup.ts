/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { afterEach, expect } from 'vitest';
import { cleanup } from '@testing-library/react';
import matchers from '@testing-library/jest-dom/matchers';
import '@testing-library/jest-dom/extend-expect';

expect.extend(matchers);

/**
 * jsdom has no `ResizeObserver`, and Radix's `useSize` — reached through the
 * tooltips and popovers these components render — constructs one during the
 * commit phase. React reports that as an uncaught error and tears the tree
 * down, so a badge that rendered a moment ago is suddenly not in the document.
 *
 * It only bites when the timing lines up, which is why it showed as a test
 * failing roughly one run in six rather than as an obvious break.
 */
if (!('ResizeObserver' in globalThis)) {
	globalThis.ResizeObserver = class {
		observe() {
			// No layout in jsdom, so there is never anything to report.
		}
		unobserve() {
			// Same.
		}
		disconnect() {
			// Same.
		}
	} as unknown as typeof ResizeObserver;
}

afterEach(() => {
	cleanup();
});
