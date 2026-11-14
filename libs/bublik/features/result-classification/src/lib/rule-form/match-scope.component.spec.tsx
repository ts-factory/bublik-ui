/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';

import { TooltipProvider } from '@/shared/tailwind-ui';
import type { ClassifyOptions, ClassifyRuleOptions } from '@/shared/types';

import type { ClassifyForm } from '../classify/classify-form.types';

const RULE: ClassifyRuleOptions = {
	test_id: 21,
	test_name: 'ethtool_reset_nic',
	test_path: 'net-drv-ts/basic/ethtool_reset_nic',
	run_ids: [7],
	result_ids: [1, 2],
	parameters: { env: 'VM', flag: 'DEDICATED' },
	verdicts: [['Packet lost']],
	tags: {
		default: ['fixture=net-drv-ts'],
		allowed: ['fixture=net-drv-ts', 'sfc']
	}
};

const OTHER: ClassifyRuleOptions = {
	...RULE,
	test_id: 22,
	test_name: 'rx_fcs',
	test_path: 'net-drv-ts/rx_path/rx_fcs',
	result_ids: [3, 4],
	parameters: { mtu: '1500' },
	// One result failed with two verdicts, the other with none.
	verdicts: [['Packet lost', 'Timeout'], []]
};

/** The first test again, in a run with one more important tag. */
const RULE_HW: ClassifyRuleOptions = {
	...RULE,
	run_ids: [8],
	result_ids: [5],
	tags: {
		default: ['fixture=net-drv-ts', 'kernel=6.2'],
		allowed: ['fixture=net-drv-ts', 'kernel=6.2', 'sfc']
	}
};

// What the mocked endpoint answers; a test may swap it for other results.
const served: { options: ClassifyOptions } = { options: [RULE] };

vi.mock('@/services/bublik-api', () => ({
	useGetClassifyOptionsQuery: () => ({
		data: served.options,
		isLoading: false,
		isError: false
	})
}));

// The SVG icons do not load under vitest; a stub per name keeps `Icon` rendering.
vi.mock('@/icons', async (importOriginal) => {
	const Stub = (props: Record<string, unknown>) => <svg {...props} />;
	const icons = await importOriginal<Record<string, unknown>>();

	return Object.fromEntries(Object.keys(icons).map((name) => [name, Stub]));
});

// jsdom has no layout; cmdk scrolls the active row into view on open.
Element.prototype.scrollIntoView = vi.fn();

const { MatchScope } = await import('./match-scope.component');
const { useClassifyForm } = await import('../classify/classify-form.hooks');

function renderScope(...options: ClassifyRuleOptions[]) {
	const ref: { form?: ClassifyForm } = {};

	served.options = options.length ? options : [RULE];
	const runs = [
		{ resultIds: served.options.flatMap((rule) => rule.result_ids) }
	];

	function Harness() {
		const form = useClassifyForm();

		ref.form = form;

		return <MatchScope form={form} runs={runs} />;
	}

	render(
		<TooltipProvider>
			<Harness />
		</TooltipProvider>
	);

	return ref;
}

// Held for the whole test: a click re-renders, and the mock answers again.
afterEach(() => {
	served.options = [RULE];
});

function cards() {
	return screen.getAllByTestId('match-scope-test');
}

function card(key: string) {
	return cards().find(
		(element) => element.getAttribute('data-rule-key') === key
	) as HTMLElement;
}

function chips(scope: HTMLElement, field: string) {
	return within(scope)
		.getByTestId(`match-scope-${field}`)
		.querySelectorAll('[data-testid="scope-value-chip"]');
}

function values(scope: HTMLElement, field: string) {
	return Array.from(chips(scope, field)).map((chip) =>
		chip.getAttribute('data-value')
	);
}

/** The verdict lists a card keeps, a row each; none once dropped. */
function verdictLists(scope: HTMLElement) {
	return Array.from(
		within(scope).getAllByTestId('match-scope-verdict-list')
	).map((row) =>
		Array.from(row.querySelectorAll('[data-testid="scope-value-chip"]')).map(
			(chip) => chip.getAttribute('data-value')
		)
	);
}

function verdictsKept(scope: HTMLElement) {
	return (
		within(scope)
			.getByTestId('match-scope-verdicts')
			.getAttribute('data-kept') === 'true'
	);
}

describe('MatchScope', () => {
	it('starts with every parameter, the verdicts and the important tags kept', () => {
		renderScope();

		const [only] = cards();

		expect(cards()).toHaveLength(1);
		expect(values(only, 'parameters')).toEqual(['env', 'flag']);
		expect(verdictLists(only)).toEqual([['Packet lost']]);
		expect(values(only, 'tags')).toEqual(['fixture=net-drv-ts']);
		expect(screen.queryByTestId('match-scope-summary')).toBeNull();
		expect(within(only).queryByTestId('match-scope-standing')).toBeNull();
	});

	it('shows a card per test path, its rules stacked inside', () => {
		renderScope(RULE, OTHER, RULE_HW);

		const paths = screen.getAllByTestId('match-scope-path');

		expect(
			paths.map(
				(path) => within(path).getByTestId('match-scope-test-path').textContent
			)
		).toEqual([
			'net-drv-ts/basic/ethtool_reset_nic',
			'net-drv-ts/rx_path/rx_fcs'
		]);
		expect(
			within(paths[0])
				.getAllByTestId('match-scope-test')
				.map((rule) => rule.getAttribute('data-rule-key'))
		).toEqual(['21:7', '21:8']);
		expect(within(paths[0]).getByText('Rule 2')).toBeInTheDocument();
		expect(
			within(paths[0]).getByTestId('match-scope-path-rules')
		).toHaveTextContent('2 rules');
		expect(within(paths[1]).queryByTestId('match-scope-path-rules')).toBeNull();
		expect(within(paths[1]).getByText('Rule')).toBeInTheDocument();
		expect(
			within(card('21:7')).getByTestId('match-scope-results')
		).toHaveTextContent('2 results');
		// A rule is stored per verdict list of the second test's rule.
		expect(verdictLists(card('22:7'))).toEqual([
			['Packet lost', 'Timeout'],
			['']
		]);
		expect(
			within(card('22:7')).getByTestId('match-scope-rules')
		).toHaveTextContent('2 rules');
		expect(screen.getByTestId('match-scope-summary')).toHaveTextContent(
			'4 rules'
		);
	});

	it('edits one rule without touching the others', () => {
		renderScope(RULE, RULE_HW);

		fireEvent.click(
			within(card('21:8')).getByRole('button', { name: 'Remove env: VM' })
		);
		fireEvent.click(
			within(card('21:8')).getByRole('button', { name: 'Clear tags' })
		);

		expect(values(card('21:8'), 'parameters')).toEqual(['flag']);
		expect(values(card('21:8'), 'tags')).toEqual([]);
		expect(values(card('21:7'), 'parameters')).toEqual(['env', 'flag']);
		expect(values(card('21:7'), 'tags')).toEqual(['fixture=net-drv-ts']);
	});

	it('drops the verdicts from their bin and restores them', () => {
		renderScope();

		const [only] = cards();

		fireEvent.click(
			within(only).getByRole('button', { name: 'Clear verdicts' })
		);

		expect(verdictsKept(only)).toBe(false);
		expect(within(only).getByTestId('match-scope-verdicts')).toHaveTextContent(
			'Not kept: not matched on'
		);
		expect(within(only).getByTestId('match-scope-standing')).toHaveTextContent(
			'any verdicts'
		);

		fireEvent.click(
			within(only).getByRole('button', { name: 'Restore verdicts' })
		);

		expect(verdictsKept(only)).toBe(true);
		expect(within(only).queryByTestId('match-scope-standing')).toBeNull();
	});

	it("empties and restores one rule from the card's buttons", () => {
		renderScope(RULE, OTHER);

		fireEvent.click(
			within(card('22:7')).getByRole('button', {
				name: 'Empty this rule: match on its path alone'
			})
		);

		expect(values(card('22:7'), 'parameters')).toEqual([]);
		expect(values(card('22:7'), 'tags')).toEqual([]);
		expect(verdictsKept(card('22:7'))).toBe(false);
		expect(
			within(card('22:7')).getByTestId('match-scope-standing')
		).toHaveTextContent('path only');
		expect(values(card('21:7'), 'parameters')).toEqual(['env', 'flag']);

		fireEvent.click(
			within(card('22:7')).getByRole('button', {
				name: 'This rule back to everything its results have'
			})
		);

		expect(values(card('22:7'), 'parameters')).toEqual(['mtu']);
		expect(verdictsKept(card('22:7'))).toBe(true);
	});

	it('says when the results of a rule share no parameter', () => {
		renderScope({ ...RULE, parameters: {} });

		const [only] = cards();

		expect(
			within(only).getByTestId('match-scope-parameters')
		).toHaveTextContent('none shared by these results');
		expect(within(only).getByTestId('match-scope-standing')).toHaveTextContent(
			'any parameters'
		);
	});

	it('says when a rule is left matching on what an earlier one does', () => {
		renderScope(RULE, RULE_HW);

		expect(screen.getByTestId('match-scope-summary')).toHaveTextContent(
			'2 rules'
		);

		fireEvent.click(
			within(card('21:8')).getByRole('button', { name: 'Remove kernel: 6.2' })
		);

		expect(screen.getByTestId('match-scope-summary')).toHaveTextContent(
			'1 rule'
		);
		expect(
			within(card('21:8')).getByTestId('match-scope-merged')
		).toBeInTheDocument();
		expect(within(card('21:7')).queryByTestId('match-scope-merged')).toBeNull();
	});

	it('still shows the rules of results classified just this once, not editable', async () => {
		const ref = renderScope();

		fireEvent.click(screen.getByRole('button', { name: 'Remove env: VM' }));
		ref.form?.setValue('scope', 'oneoff');

		expect(await screen.findByTestId('match-scope-oneoff')).toHaveTextContent(
			'The rule will be saved switched off'
		);
		expect(
			screen.getByTestId('match-scope-test').closest('[data-readonly]')
		).toHaveAttribute('inert');

		ref.form?.setValue('scope', 'future');

		expect(await screen.findByTestId('match-scope-test')).toBeInTheDocument();
		expect(values(cards()[0], 'parameters')).toEqual(['flag']);
	});
});
