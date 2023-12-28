/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { Provider } from 'react-redux';
import { render } from '@testing-library/react';

import { store } from '@/bublik/+state';

import {
	ImportEventTable,
	ImportEventTableEmpty,
	ImportEventTableError,
	ImportEventTableLoading
} from './import-event-table.component';

describe('ImportEventTableComponent', () => {
	it('should render successfully', () => {
		const { asFragment } = render(
			<Provider store={store}>
				<ImportEventTable data={[]} />
			</Provider>
		);

		expect(asFragment()).toMatchSnapshot();
	});

	it('should render loading state', () => {
		const { asFragment } = render(<ImportEventTableLoading />);

		expect(asFragment()).toMatchSnapshot();
	});

	it('should render error state', () => {
		const { asFragment } = render(
			<ImportEventTableError error={{ status: 404 }} />
		);

		expect(asFragment()).toMatchSnapshot();
	});

	it('should render empty state', () => {
		const { asFragment } = render(<ImportEventTableEmpty />);

		expect(asFragment()).toMatchSnapshot();
	});
});
