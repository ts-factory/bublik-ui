/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { describe, expect, it, vi } from 'vitest';
import {
	RenderOptions,
	render as rtlRender,
	screen
} from '@testing-library/react';
import { PropsWithChildren, ReactElement, ReactNode, forwardRef } from 'react';

import { TooltipProvider } from '@/shared/tailwind-ui';
import type { ResultIssueRef } from '@/shared/types';

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

// The real trigger opens a drawer wired to RTK Query; what matters here is
// only whether it is offered, and where it sits relative to the verdict chip.
vi.mock('./classify-button', () => ({
	ClassifyButton: ({ resultId }: { resultId: number }) => (
		<button data-testid="classify-trigger" data-result-id={resultId}>
			Classify
		</button>
	)
}));

const { ResultIssueBadges } = await import('./classification-badges');

const render = (ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) =>
	rtlRender(ui, {
		wrapper: (props: PropsWithChildren) => (
			<TooltipProvider delayDuration={0}>{props.children}</TooltipProvider>
		),
		...options
	});

let ruleId = 0;

function stamp(partial: Partial<ResultIssueRef> = {}): ResultIssueRef {
	return {
		issue_id: 1,
		issue_title: 'Issue',
		issue_state: 'open',
		bug_key: 'ref://JIRA/E2E-123',
		category: 'known-issue',
		expected: true,
		rule_id: ++ruleId,
		origin: 'import',
		...partial
	};
}

/** The key chip, which is where the closed strike lives. */
const keys = () => screen.getAllByText(/^(E2E-|#)/);

describe('ResultIssueBadges — closed issues', () => {
	it('strikes the key of a stamp whose issue is closed', () => {
		render(
			<ResultIssueBadges hasError issues={[stamp({ issue_state: 'closed' })]} />
		);

		expect(keys()[0]).toHaveClass('line-through');
		expect(keys()[0]).toHaveAttribute('data-issue-state', 'closed');
	});

	it('leaves an open issue unstruck', () => {
		render(<ResultIssueBadges hasError issues={[stamp()]} />);

		expect(keys()[0]).not.toHaveClass('line-through');
		expect(keys()[0]).not.toHaveAttribute('data-issue-state');
	});

	/*
	 * The case the aggregate effect chip cannot express: it reports one answer
	 * for the whole result, so on a row carrying several stamps it cannot say
	 * which issue died. Per-key striking can.
	 */
	it('strikes only the closed stamp when a result carries several', () => {
		render(
			<ResultIssueBadges
				hasError
				issues={[
					stamp({ issue_id: 1, bug_key: 'ref://JIRA/E2E-123' }),
					stamp({
						issue_id: 2,
						bug_key: 'ref://JIRA/E2E-140',
						issue_state: 'closed'
					})
				]}
			/>
		);

		expect(screen.getByText('E2E-123')).not.toHaveClass('line-through');
		expect(screen.getByText('E2E-140')).toHaveClass('line-through');
	});

	/*
	 * A closed issue is a fact about the issue, not about the count, so it shows
	 * even where there is no count to affect.
	 */
	it('still strikes on a passing result, which carries no effect chip', () => {
		render(
			<ResultIssueBadges
				hasError={false}
				issues={[stamp({ issue_state: 'closed' })]}
			/>
		);

		expect(keys()[0]).toHaveClass('line-through');
		expect(screen.queryByTestId('result-issue-effect')).toBeNull();
	});

	/*
	 * `underline` and `line-through` are the same CSS property, so a hover
	 * underline would replace the strike and the issue would look alive exactly
	 * while you point at it.
	 */
	it('does not pair the strike with a hover underline', () => {
		render(
			<ResultIssueBadges hasError issues={[stamp({ issue_state: 'closed' })]} />
		);

		expect(keys()[0].className).not.toMatch(/hover:underline/);
	});
});

describe('ResultIssueBadges — effect chip', () => {
	it('reports the effect once for a failing result', () => {
		render(<ResultIssueBadges hasError issues={[stamp()]} />);

		expect(screen.getByTestId('result-issue-effect')).toBeInTheDocument();
	});

	it('reads untriaged for a failure nobody has classified', () => {
		render(<ResultIssueBadges hasError issues={[]} />);

		expect(screen.getByTestId('result-untriaged')).toBeInTheDocument();
	});

	it('renders nothing for a passing result with no stamps', () => {
		const { container } = render(
			<ResultIssueBadges hasError={false} issues={[]} />
		);

		expect(container).toBeEmptyDOMElement();
	});
});

describe('ResultIssueBadges — the Classify slot', () => {
	it('offers no trigger to a surface that passed no result', () => {
		render(<ResultIssueBadges hasError issues={[]} />);

		expect(screen.queryByTestId('classify-trigger')).not.toBeInTheDocument();
	});

	it('puts the trigger beside Untriaged on a failure nobody has classified', () => {
		render(<ResultIssueBadges hasError issues={[]} resultId={42} />);

		const trigger = screen.getByTestId('classify-trigger');

		expect(trigger).toHaveAttribute('data-result-id', '42');
		// Same line as the verdict, which is the whole point of moving it here.
		expect(screen.getByTestId('result-untriaged').parentElement).toBe(
			trigger.parentElement
		);
	});

	it('leads the line, so the button is at one offset on every row', () => {
		// The chips are five different widths and one case has none at all, so
		// anything placed after them moves from row to row.
		render(<ResultIssueBadges hasError issues={[stamp()]} resultId={42} />);

		const line = screen.getByTestId('classify-trigger').parentElement;

		expect(line?.firstElementChild).toBe(
			screen.getByTestId('classify-trigger')
		);
	});

	it('offers the trigger on a passing result that carries stamps', () => {
		// No verdict chip here — nothing failed, so there is nothing to suppress
		// — and the button still has to sit where it does on every other row.
		render(
			<ResultIssueBadges hasError={false} issues={[stamp()]} resultId={42} />
		);

		const trigger = screen.getByTestId('classify-trigger');

		expect(trigger.parentElement?.firstElementChild).toBe(trigger);
		expect(screen.queryByTestId('result-issue-effect')).not.toBeInTheDocument();
	});

	it('keeps the trigger on a failure that already carries a stamp', () => {
		render(<ResultIssueBadges hasError issues={[stamp()]} resultId={42} />);

		expect(screen.getByTestId('classify-trigger')).toBeInTheDocument();
		expect(screen.getByTestId('result-issue-effect')).toBeInTheDocument();
	});

	it('renders nothing at all for a passing, unstamped result', () => {
		const { container } = render(
			<ResultIssueBadges hasError={false} issues={[]} resultId={42} />
		);

		expect(container).toBeEmptyDOMElement();
	});
});
