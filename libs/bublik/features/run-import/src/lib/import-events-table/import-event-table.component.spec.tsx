/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useState } from 'react';
import { PaginationState } from '@tanstack/react-table';
import { Provider } from 'react-redux';
import { render } from '@testing-library/react';
import { store } from '@/bublik/+state';
import {
	ImportEventTable,
	ImportEventTableEmpty,
	ImportEventTableError,
	ImportEventTableLoading
} from './import-event-table.component';
function EventTableDemo() {
	const [pagination, setPagination] = useState<PaginationState>({
		pageIndex: 0,
		pageSize: 25
	});
	return (
		<Provider store={store}>
			<ImportEventTable
				data={[]}
				pagination={pagination}
				setPagination={setPagination}
			/>
		</Provider>
	);
}
describe('ImportEventTableComponent', () => {
	it('should render successfully', () => {
		const { asFragment } = render(<EventTableDemo />);
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
