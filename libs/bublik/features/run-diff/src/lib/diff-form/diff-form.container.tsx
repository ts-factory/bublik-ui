/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { matchPath } from 'react-router-dom';
import { toast } from 'sonner';

import { useNavigateWithProject } from '@/bublik/features/projects';

import { DiffForm, DiffFormValues } from './diff-form.component';

const extractRunId = (value: string): number | Error => {
	const num = Number(value);
	if (!isNaN(num) && value.trim() !== '') return num;

	try {
		const url = new URL(value);
		const match = matchPath('/v2/runs/:id', url.pathname);
		if (match && match.params.id) return Number(match.params.id);
		return new Error('Invalid run URL format');
	} catch (e) {
		return new Error('Invalid run ID or URL');
	}
};

export interface DiffFormContainerProps {
	defaultValues?: Partial<DiffFormValues>;
}

export const DiffFormContainer = (props: DiffFormContainerProps) => {
	const navigate = useNavigateWithProject();

	const handleDiffFormSubmit = (form: DiffFormValues) => {
		const { leftRunId, rightRunId } = form;

		const leftId = extractRunId(leftRunId);
		if (leftId instanceof Error) return toast.error(leftId.message);

		const rightId = extractRunId(rightRunId);
		if (rightId instanceof Error) return toast.error(rightId.message);

		navigate({
			pathname: '/compare',
			search: `?left=${leftId}&right=${rightId}`
		});
	};

	return (
		<DiffForm
			defaultValues={props.defaultValues}
			onSubmit={handleDiffFormSubmit}
		/>
	);
};
