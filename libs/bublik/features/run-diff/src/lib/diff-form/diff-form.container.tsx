/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useNavigate } from 'react-router-dom';

import { DiffForm, DiffFormValues } from './diff-form.component';

export interface DiffFormContainerProps {
	defaultValues?: Partial<DiffFormValues>;
}

export const DiffFormContainer = (props: DiffFormContainerProps) => {
	const navigate = useNavigate();

	const handleDiffFormSubmit = (form: DiffFormValues) => {
		const { rightRunId, leftRunId } = form;

		navigate({
			pathname: '/compare',
			search: `left=${leftRunId}&right=${rightRunId}`
		});
	};

	return (
		<DiffForm
			defaultValues={props.defaultValues}
			onSubmit={handleDiffFormSubmit}
		/>
	);
};
