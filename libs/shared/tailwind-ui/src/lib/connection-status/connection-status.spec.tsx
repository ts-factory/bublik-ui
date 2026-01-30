/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { ConnectionStatus } from './connection-status';
describe('ConnectionStatus', () => {
	it('should render successfully', () => {
		const { getByTestId } = render(<ConnectionStatus isOnline={false} />);
		const element = getByTestId('tw-connection-status');
		expect(element).toBeVisible();
	});
	// it('should match snapshot', () => {
	// 	const { asFragment } = render(<ConnectionStatus isOnline={false} />);
	// 	expect(asFragment()).toMatchSnapshot();
	// });
	// it('should not be present if online', () => {
	// 	const { queryByTestId, container } = render(
	// 		<ConnectionStatus isOnline={false} />
	// 	);
	// 	const element = queryByTestId('tw-connection-status');
	// 	expect(element).not.toBeInTheDocument();
	// });
	// it('should be closed on dismiss button click', async () => {
	// 	const { getByTestId, getByRole, queryByTestId } = render(
	// 		<ConnectionStatus isOnline={false} />
	// 	);
	// 	const element = getByTestId('tw-connection-status');
	// 	const button = getByRole('button');
	// 	expect(element).toBeVisible();
	// 	fireEvent.click(button);
	// 	await waitForElementToBeRemoved(() =>
	// 		queryByTestId('tw-connection-status')
	// 	);
	// 	expect(queryByTestId('tw-connection-status')).not.toBeInTheDocument();
	// });
});
