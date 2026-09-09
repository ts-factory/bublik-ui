/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { TooltipProvider } from '@radix-ui/react-tooltip';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import { ContextUsageIndicator } from './context-usage-indicator';

function renderIndicator(
	props: React.ComponentProps<typeof ContextUsageIndicator>
) {
	return render(
		<TooltipProvider>
			<ContextUsageIndicator {...props} />
		</TooltipProvider>
	);
}

describe('ContextUsageIndicator', () => {
	it('renders nothing when neither tokens nor compaction are present', () => {
		renderIndicator({ tokens: 0, limit: null });
		// The indicator returns null; TooltipProvider adds invisible wrappers
		// but no text content or interactive elements land in the DOM.
		expect(screen.queryByText(/token/i)).toBeNull();
		expect(screen.queryByText('%')).toBeNull();
		expect(screen.queryByText('compacted')).toBeNull();
	});

	it('shows compacted status without tokens or limit', () => {
		renderIndicator({ tokens: undefined, limit: null, compacted: true });
		expect(screen.getByText('compacted')).toBeDefined();
		expect(screen.getByLabelText('Conversation compacted')).toBeDefined();
	});

	it('shows compacted status with zero tokens', () => {
		renderIndicator({ tokens: 0, limit: null, compacted: true });
		expect(screen.getByText('compacted')).toBeDefined();
	});

	it('shows percentage ring when tokens and limit are known', () => {
		renderIndicator({ tokens: 5000, limit: 10000 });
		expect(screen.getByText('50%')).toBeDefined();
		expect(screen.getByLabelText('Context window 50% full')).toBeDefined();
	});

	it('shows percentage with compacted suffix', () => {
		renderIndicator({ tokens: 9000, limit: 10000, compacted: true });
		expect(screen.getByText('90%')).toBeDefined();
		expect(screen.getByText(/compacted/)).toBeDefined();
	});

	it('caps fraction at 100%', () => {
		renderIndicator({ tokens: 15000, limit: 10000 });
		expect(screen.getByText('100%')).toBeDefined();
	});

	it('prefers compaction status when tokens are zero but compacted', () => {
		renderIndicator({ tokens: 0, limit: null, compacted: true });
		expect(screen.queryByText('%')).toBeNull();
		expect(screen.getByText('compacted')).toBeDefined();
	});
});
