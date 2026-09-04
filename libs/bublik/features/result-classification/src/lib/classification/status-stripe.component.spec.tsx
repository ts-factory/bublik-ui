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

import {
	STATUS_STRIPE_COLUMN_META,
	StatusStripe
} from './status-stripe.component';
import {
	ISSUE_RULES_STATE_META,
	RUN_ISSUE_EFFECT_META,
	UNTRIAGED_META,
	issueRulesState,
	resultIssueEffect
} from './classification.utils';

vi.mock('@/icons', () => {
	const names = [
		'AddSymbol',
		'Aggregation',
		'ArrowLeanUp',
		'ArrowShortSmall',
		'ArrowShortTop',
		'Bin',
		'BoxArrowRight',
		'BoxCheckmark',
		'BoxCrossMark',
		'BoxExclamationMark',
		'Upload',
		'BoxQuestionMark',
		'Bulb',
		'Calendar',
		'Category',
		'ChevronDown',
		'Clock',
		'CrossSimple',
		'Cross',
		'DashboardModeColumns',
		'DashboardModeRowsLine',
		'DashboardModeRows',
		'Edit',
		'ExpandSelection',
		'EyeHide',
		'EyeShow',
		'Filter',
		'Folder',
		'GlobalSearch',
		'HashSymbol',
		'Import',
		'InformationCircleCheckmark',
		'InformationCircleCrossMark',
		'InformationCircleExclamationMark',
		'InformationCircleForbidden',
		'InformationCircleProgress',
		'InformationCircleQuestionMark',
		'InformationCircleStop',
		'InputError',
		'LayoutLogHeaderSidebar',
		'LayoutLogHeader',
		'LayoutLogSidebar',
		'LayoutLogSingle',
		'LayoutSidebarHeader',
		'LineChartMultiple',
		'LineChartSingle',
		'LineChartOnline',
		'LineChart',
		'LineGraph',
		'MagnifyingGlass',
		'PaperChangelog',
		'PaperListText',
		'PaperShort',
		'PaperStack',
		'PaperText',
		'Paper',
		'PieChart',
		'Play',
		'Profile',
		'ProgressIndicator',
		'Refresh',
		'Scan',
		'SidebarArrows',
		'SortArrow',
		'SwapArrows',
		'ThreeDotsVertical',
		'TimeCircle',
		'TriangleCheckmark',
		'TriangleExclamationMark',
		'TriangleQuestionMark',
		'TextWrap',
		'TriangleDelta',
		'SettingsSliders',
		'ResetZoom',
		'LineChartMode',
		'ScatterChartMode',
		'Image',
		'TwoUsers',
		'IssueIcon',
		'FilePlus',
		'Download',
		'Gear',
		'ExternalLink',
		'Network',
		'Password'
	];

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

		expect(stripe).toHaveClass('absolute');
		expect(stripe).toHaveClass('bg-bg-ok');
		expect(stripe).toHaveAttribute('data-status', 'Suppressed');
	});

	it('paints over the row border rather than being framed by it', () => {
		render(<StatusStripe meta={RUN_ISSUE_EFFECT_META.suppressed} />);

		const stripe = screen.getByTestId('status-stripe');

		expect(stripe).toHaveClass('-inset-y-px', '-left-px', 'right-0');
		expect(stripe).toHaveClass('rounded-l-md');
		expect(stripe.className).not.toMatch(/(^|\s)z-/);
	});

	it('positions the cell from the td and never the th', () => {
		expect(STATUS_STRIPE_COLUMN_META.className).not.toMatch(/relative/);
		expect(STATUS_STRIPE_COLUMN_META.cellClassName).toContain('relative');
	});

	it('stops the leading cell clipping the stripe overhang', () => {
		expect(STATUS_STRIPE_COLUMN_META.cellClassName).toContain(
			'overflow-visible'
		);
	});

	it('pins the gutter width rather than suggesting it', () => {
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
