/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { toast } from 'sonner';

import { useNavigateWithProject } from '@/bublik/features/projects';

import { DiffForm, DiffFormValues } from './diff-form.component';
import { extractRunId } from './diff-form.utils';

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

		// The push carries the sidebar state and projects of the run page.
		void navigate({
			to: '/compare',
			search: { left: String(leftId), right: String(rightId) }
		});
	};

	return (
		<DiffForm
			defaultValues={props.defaultValues}
			onSubmit={handleDiffFormSubmit}
		/>
	);
};
