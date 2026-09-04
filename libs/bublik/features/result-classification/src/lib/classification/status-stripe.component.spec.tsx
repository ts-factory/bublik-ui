/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { describe, expect, it, vi } from 'vitest';
import {
	RenderOptions,
	render as rtlRender,
	screen
} from '@testing-library/react';
import { PropsWithChildren, ReactElement } from 'react';

import { TooltipProvider } from '@/shared/tailwind-ui';

import { STATUS_STRIPE_COLUMN_META, StatusStripe } from './status-stripe.component';
import {
	ISSUE_RULES_STATE_META,
	RUN_ISSUE_EFFECT_META,
	UNTRIAGED_META,
	issueRulesState,
	resultIssueEffect
} from './classification.utils';

// The icon set is imported through SVGR, which vitest does not run, so every
// glyph would come back undefined. The stripe only cares that an icon renders,
// not which one, but the mock has to name them: vitest validates each import
// against what the factory returned. `ICON_NAMES` is the barrel's export list.
vi.mock('@/icons', () => {
	// Inline, because `vi.mock` is hoisted above every top-level binding.
	const names = ['AddSymbol', 'Aggregation', 'ArrowLeanUp', 'ArrowShortSmall', 'ArrowShortTop', 'Bin', 'BoxArrowRight', 'BoxCheckmark', 'BoxCrossMark', 'BoxExclamationMark', 'Upload', 'BoxQuestionMark', 'Bulb', 'Calendar', 'Category', 'ChevronDown', 'Clock', 'CrossSimple', 'Cross', 'DashboardModeColumns', 'DashboardModeRowsLine', 'DashboardModeRows', 'Edit', 'ExpandSelection', 'EyeHide', 'EyeShow', 'Filter', 'Folder', 'GlobalSearch', 'HashSymbol', 'Import', 'InformationCircleCheckmark', 'InformationCircleCrossMark', 'InformationCircleExclamationMark', 'InformationCircleForbidden', 'InformationCircleProgress', 'InformationCircleQuestionMark', 'InformationCircleStop', 'InputError', 'LayoutLogHeaderSidebar', 'LayoutLogHeader', 'LayoutLogSidebar', 'LayoutLogSingle', 'LayoutSidebarHeader', 'LineChartMultiple', 'LineChartSingle', 'LineChartOnline', 'LineChart', 'LineGraph', 'MagnifyingGlass', 'PaperChangelog', 'PaperListText', 'PaperShort', 'PaperStack', 'PaperText', 'Paper', 'PieChart', 'Play', 'Profile', 'ProgressIndicator', 'Refresh', 'Scan', 'SidebarArrows', 'SortArrow', 'SwapArrows', 'ThreeDotsVertical', 'TimeCircle', 'TriangleCheckmark', 'TriangleExclamationMark', 'TriangleQuestionMark', 'TextWrap', 'TriangleDelta', 'SettingsSliders', 'ResetZoom', 'LineChartMode', 'ScatterChartMode', 'Image', 'TwoUsers', 'IssueIcon', 'FilePlus', 'Download', 'Gear', 'ExternalLink', 'Network', 'Password'];

	return Object.fromEntries(
		names.map((name) => [
			name,
			(props: Record<string, unknown>) => <svg data-icon={name} {...props} />
		])
	);
});


const render = (ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) =>
	rtlRender(ui, {
		wrapper: (props: PropsWithChildren) => (
			<TooltipProvider delayDuration={0}>{props.children}</TooltipProvider>
		),
		...options
	});

describe('StatusStripe', () => {
	it('fills the cell rather than sitting inside it', () => {
		render(<StatusStripe meta={RUN_ISSUE_EFFECT_META.suppressed} />);

		const stripe = screen.getByTestId('status-stripe');

		// Positioned against the cell's own `relative`: the fill has to span the
		// row's full height, which this component cannot know.
		expect(stripe).toHaveClass('absolute');
		expect(stripe).toHaveClass('bg-bg-ok');
		expect(stripe).toHaveAttribute('data-status', 'Suppressed');
	});

	it('paints over the row border rather than being framed by it', () => {
		render(<StatusStripe meta={RUN_ISSUE_EFFECT_META.suppressed} />);

		const stripe = screen.getByTestId('status-stripe');

		// Every classification cell reserves a 1px border — transparent at rest,
		// `primary` on hover — and an absolute child's offsets resolve against the
		// padding box, so a plain `inset-0` sat *inside* that border and wore it as
		// a frame. The 1px overhang on top, bottom and left lands exactly on the
		// card's outer edge instead. `right-0` stays put: the leading cell has no
		// right border, so its padding and border boxes share that edge.
		expect(stripe).toHaveClass('-inset-y-px', '-left-px', 'right-0');
		// The corner the cell's `overflow-hidden` used to clip. It cannot any
		// more — clipping would cut the overhang off — so the stripe rounds itself.
		expect(stripe).toHaveClass('rounded-l-md');
		// No z-index: a positioned child already paints over its parent's border,
		// and a z-index would also lift the stripe over the pinned header.
		expect(stripe.className).not.toMatch(/(^|\s)z-/);
	});

	it('positions the cell from the td and never the th', () => {
		// `position` on the shared key reaches the header, where `twMerge` reads
		// it as replacing `sticky` and unpins it.
		expect(STATUS_STRIPE_COLUMN_META.className).not.toMatch(/relative/);
		expect(STATUS_STRIPE_COLUMN_META.cellClassName).toContain('relative');
	});

	it('stops the leading cell clipping the stripe overhang', () => {
		// The leading cell of every classification row is `overflow-hidden`, which
		// would cut off the 1px the stripe overhangs its border by. `cellClassName`
		// is the last thing fed to `cn`, so this wins the merge for the stripe
		// column and leaves every other table's first column clipping.
		expect(STATUS_STRIPE_COLUMN_META.cellClassName).toContain(
			'overflow-visible'
		);
	});

	it('pins the gutter width rather than suggesting it', () => {
		// A fixed grid track, not a Tailwind width: the table is one CSS grid, so
		// the column's size belongs to the track list rather than to a class on
		// every cell. This used to need `w-`/`min-w-`/`max-w-` all three, because
		// `table-auto` treated a bare width as advice and squeezed the column
		// exactly when the row was crowded — precisely when the stripe matters
		// most. A grid track is not advice.
		expect(STATUS_STRIPE_COLUMN_META.width).toBe('24px');
		expect(STATUS_STRIPE_COLUMN_META.className).not.toMatch(/w-/);
	});
});

describe('the state each table stripes on', () => {
	it('separates a rule that is in force from one the issue deactivated', () => {
		const inForce = issueRulesState({ state: 'open', total: 1, active: 1 });
		const deactivated = issueRulesState({
			state: 'closed',
			total: 1,
			active: 0
		});
		// Reopening an issue does not re-activate the rules closing it turned
		// off, so this is a state an open issue reaches too.
		const dormant = issueRulesState({ state: 'open', total: 1, active: 0 });

		expect(inForce.stripeClassName).not.toBe(deactivated.stripeClassName);
		expect(dormant.stripeClassName).not.toBe(deactivated.stripeClassName);
		expect(dormant.stripeClassName).toBe(
			ISSUE_RULES_STATE_META.dormant.stripeClassName
		);
	});

	it('gives every "needs a human" state the same violet', () => {
		expect(UNTRIAGED_META.stripeClassName).toBe(
			RUN_ISSUE_EFFECT_META.marked.stripeClassName
		);
		expect(UNTRIAGED_META.stripeClassName).toBe(
			ISSUE_RULES_STATE_META.dormant.stripeClassName
		);
	});

	it('stripes a closed issue as counting again, not as suppressed', () => {
		const effect = resultIssueEffect([
			{ expected: true, issue_state: 'closed' }
		]);

		expect(effect.value).toBe('stale');
		expect(effect.stripeClassName).not.toBe(
			RUN_ISSUE_EFFECT_META.suppressed.stripeClassName
		);
	});
});
