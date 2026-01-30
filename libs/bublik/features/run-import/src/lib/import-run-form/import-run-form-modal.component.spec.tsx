/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { render } from '@testing-library/react';
import { ImportRunFormModal } from './import-run-form-modal.component';
describe('ImportRunFormModalComponent', () => {
	it('should render successfully', () => {
		const { asFragment } = render(<ImportRunFormModal />);
		expect(asFragment()).toMatchSnapshot();
	});
});
