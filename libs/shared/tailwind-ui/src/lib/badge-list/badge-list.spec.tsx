/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { it, describe, expect } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { BadgeList, BadgeListProps } from './badge-list';
const getBadgeListProps = (): BadgeListProps => {
	return {
		badges: [
			{ payload: 'badge-1' },
			{ isImportant: true, payload: 'badge-important' },
			{ payload: 'badge-3' }
		]
	};
};
describe('components/BadgeList', () => {
	it('should render successfully', () => {
		const { getByTestId } = render(<BadgeList {...getBadgeListProps()} />);
		const badge = getByTestId('tw-badge-list');
		expect(badge).toBeVisible();
	});
	it('should match snapshot', () => {
		const { asFragment } = render(<BadgeList {...getBadgeListProps()} />);
		expect(asFragment()).toMatchSnapshot();
	});
	it('should accept background color for badges', () => {
		const { asFragment } = render(
			<BadgeList {...getBadgeListProps()} className="bg-badge-10" />
		);
		expect(asFragment()).toMatchSnapshot();
	});
	it('should highlight selected badges', () => {
		const { asFragment } = render(
			<BadgeList {...getBadgeListProps()} selectedBadges={['badge-3']} />
		);
		expect(asFragment()).toMatchSnapshot();
	});
	it('should highlight selected badges with custom background color', () => {
		const { asFragment } = render(
			<BadgeList
				{...getBadgeListProps()}
				selectedBadges={['badge-3']}
				className="bg-badge-10"
			/>
		);
		expect(asFragment()).toMatchSnapshot();
	});
	it('should render a plain env badge inline', () => {
		const { asFragment } = render(
			<BadgeList
				{...getBadgeListProps()}
				badges={[{ payload: 'badge-1' }, { payload: 'env=test-env' }]}
				selectedBadges={['badge-3']}
				className="bg-badge-10"
			/>
		);
		expect(asFragment()).toMatchSnapshot();
	});
	it('should render preformatted parameters as their own blocks', () => {
		const { asFragment } = render(
			<BadgeList
				badges={[
					{ payload: 'badge-1' },
					{ payload: 'env={ addr 1, port 2 }' },
					{ payload: 'tmpl=pdus {\n  eth\n}' }
				]}
				className="bg-badge-10"
			/>
		);
		expect(asFragment()).toMatchSnapshot();
	});
	it('should keep the raw payload when a preformatted badge is clicked', () => {
		const mock = vi.fn();
		const payload = 'env={ addr 1, port 2 }';
		const { getByLabelText } = render(
			<BadgeList badges={[{ payload }]} onBadgeClick={mock} />
		);
		fireEvent.click(getByLabelText('Copy env'));
		expect(mock).not.toHaveBeenCalled();
		fireEvent.click(getByLabelText('Copy env').closest('div')!.parentElement!);
		expect(mock).toHaveBeenCalledWith({ payload });
	});
	it('should call onClick with badge item payload', async () => {
		const mock = vi.fn();
		const { getByText } = render(
			<BadgeList {...getBadgeListProps()} onBadgeClick={mock} />
		);
		const badge = getByText('badge-1');
		fireEvent.click(badge);
		expect(mock).toHaveBeenCalledWith({ payload: 'badge-1' });
	});
});
