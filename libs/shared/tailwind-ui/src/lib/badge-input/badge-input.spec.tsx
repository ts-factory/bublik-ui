/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { useState } from 'react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { BadgeInput, BadgeInputProps } from './badge-input';
import { BadgeItem } from './types';

const SUGGESTIONS = ['time_limit=30', 'time_limit=60', 'env=VAR.iut_only'];

beforeAll(() => {
	// Radix measures the anchor with a ResizeObserver, which jsdom lacks.
	globalThis.ResizeObserver ??= class {
		observe() {
			/* noop */
		}
		unobserve() {
			/* noop */
		}
		disconnect() {
			/* noop */
		}
	};
});

type HostProps = Omit<BadgeInputProps, 'badges' | 'onBadgesChange'> & {
	onChange?: (badges: BadgeItem[]) => void;
};

function Host({ onChange, ...props }: HostProps) {
	const [badges, setBadges] = useState<BadgeItem[]>([]);

	return (
		<BadgeInput
			label="Parameters"
			placeholder="time_limit:30"
			keyValueDisplayDelimiter=": "
			keyValueSubmitDelimiter="="
			{...props}
			badges={badges}
			onBadgesChange={(next) => {
				setBadges(next);
				onChange?.(next);
			}}
		/>
	);
}

function getBadgeValues() {
	return within(screen.getByTestId('tw-badge-input-list'))
		.queryAllByRole('listitem')
		.map((item) => item.textContent);
}

describe('BadgeInput suggestions', () => {
	it('offers the suggestions matching what is typed', async () => {
		const user = userEvent.setup();
		render(<Host suggestions={SUGGESTIONS} />);

		await user.type(screen.getByRole('combobox'), 'limit');

		expect(
			screen.getAllByRole('option').map((option) => option.textContent)
		).toEqual(['time_limit: 30', 'time_limit: 60']);
	});

	it('adds a ticked suggestion as a badge in the submit form', async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		render(<Host suggestions={SUGGESTIONS} onChange={onChange} />);

		const input = screen.getByRole('combobox');
		await user.type(input, '60');
		await user.click(screen.getByRole('option', { name: 'time_limit: 60' }));

		expect(onChange).toHaveBeenLastCalledWith([
			{ id: expect.any(String), value: 'time_limit=60' }
		]);
		expect(getBadgeValues()).toEqual(['time_limit: 60']);
		expect(input).toHaveFocus();
	});

	it('toggles a row on and off, keeping the list open', async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		render(<Host suggestions={SUGGESTIONS} onChange={onChange} />);

		await user.type(screen.getByRole('combobox'), 'time');
		const row = () => screen.getByRole('option', { name: 'time_limit: 30' });

		expect(row()).toHaveAttribute('aria-selected', 'false');

		await user.click(row());
		expect(row()).toHaveAttribute('aria-selected', 'true');
		expect(getBadgeValues()).toEqual(['time_limit: 30']);

		await user.click(screen.getByRole('option', { name: 'time_limit: 60' }));
		expect(getBadgeValues()).toEqual(['time_limit: 30', 'time_limit: 60']);

		await user.click(row());
		expect(row()).toHaveAttribute('aria-selected', 'false');
		expect(getBadgeValues()).toEqual(['time_limit: 60']);
		expect(onChange).toHaveBeenLastCalledWith([
			{ id: expect.any(String), value: 'time_limit=60' }
		]);
	});

	it('toggles the row highlighted with the arrow keys on Enter', async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		render(<Host suggestions={SUGGESTIONS} onChange={onChange} />);

		await user.type(screen.getByRole('combobox'), 'time');
		await user.keyboard('{ArrowDown}{ArrowDown}{Enter}');

		expect(onChange).toHaveBeenLastCalledWith([
			{ id: expect.any(String), value: 'time_limit=60' }
		]);

		await user.keyboard('{Enter}');
		expect(onChange).toHaveBeenLastCalledWith([]);
	});

	it('ticks the rows of values already among the badges, typed ones too', async () => {
		const user = userEvent.setup();
		render(<Host suggestions={SUGGESTIONS} />);

		const input = screen.getByRole('combobox');
		await user.type(input, 'time_limit: 60{Enter}');
		await user.type(input, 'time');

		expect(
			screen
				.getAllByRole('option')
				.map((option) => [
					option.textContent,
					option.getAttribute('aria-selected')
				])
		).toEqual([
			['time_limit: 30', 'false'],
			['time_limit: 60', 'true']
		]);
	});

	it('colours the badges and the rows with the given classes', async () => {
		const user = userEvent.setup();
		render(
			<Host
				suggestions={SUGGESTIONS}
				badgeClassName={(value) =>
					value.startsWith('env') ? 'bg-badge-6' : undefined
				}
			/>
		);

		await user.type(screen.getByRole('combobox'), 'e');
		const chip = (name: string) =>
			within(screen.getByRole('option', { name })).getByText(name);

		expect(chip('env: VAR.iut_only')).toHaveClass('bg-badge-6');
		expect(chip('env: VAR.iut_only')).not.toHaveClass('bg-badge-0');
		expect(chip('time_limit: 30')).toHaveClass('bg-badge-0');

		await user.click(screen.getByRole('option', { name: 'env: VAR.iut_only' }));
		expect(
			within(screen.getByTestId('tw-badge-input-list')).getByRole('listitem')
		).toHaveClass('bg-badge-6');
	});

	it('still adds free text on Enter, matching or not', async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		render(<Host suggestions={SUGGESTIONS} onChange={onChange} />);

		const input = screen.getByRole('combobox');
		await user.type(input, 'time{Enter}');
		await user.type(input, 'buf_size: 1024{Enter}');

		expect(onChange).toHaveBeenLastCalledWith([
			expect.objectContaining({ value: 'time' }),
			expect.objectContaining({ value: 'buf_size=1024' })
		]);
	});

	it('shows no list when nothing matches', async () => {
		const user = userEvent.setup();
		render(<Host suggestions={SUGGESTIONS} />);

		await user.type(screen.getByRole('combobox'), '!env & limit');

		expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
	});

	it('shows no list for an empty suggestion list', async () => {
		const user = userEvent.setup();
		render(<Host suggestions={[]} />);

		await user.type(screen.getByRole('combobox'), 'time');

		expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
	});

	it('asks for the suggestions when the field gets focus', async () => {
		const user = userEvent.setup();
		const onSuggestionsRequest = vi.fn();
		render(
			<Host suggestions={[]} onSuggestionsRequest={onSuggestionsRequest} />
		);

		await user.click(screen.getByRole('combobox'));

		expect(onSuggestionsRequest).toHaveBeenCalled();
	});

	it('closes the list on Escape and when the field loses focus', async () => {
		const user = userEvent.setup();
		render(<Host suggestions={SUGGESTIONS} />);

		await user.type(screen.getByRole('combobox'), 'time');
		expect(screen.getByRole('listbox')).toBeInTheDocument();

		await user.keyboard('{Escape}');
		expect(screen.queryByRole('listbox')).not.toBeInTheDocument();

		await user.keyboard('{ArrowDown}');
		expect(screen.getByRole('listbox')).toBeInTheDocument();

		await user.tab();
		expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
	});

	it('stays a plain text field without suggestions', async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		render(<Host onChange={onChange} />);

		const input = screen.getByRole('textbox');
		await user.type(input, 'time{ArrowDown}{Enter}');

		expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
		expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
		expect(onChange).toHaveBeenLastCalledWith([
			expect.objectContaining({ value: 'time' })
		]);
	});
});
