/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useState } from 'react';

import { ImportEventResponse, ImportRunsFormValues } from '@/shared/types';
import { useImportRunsMutation } from '@/services/bublik-api';

import { ImportRunForm } from './import-run-form.component';
import { ImportRunFormModal } from './import-run-form-modal.component';
import { RunImportResult } from './import-run-form-result-list.component';

type FormState = 'form' | 'result';

export const useImportTasks = () => {
	const [importRuns] = useImportRunsMutation();
	const [step, setStep] = useState<FormState>('form');
	const [celeryTasks, setCeleryTasks] = useState<ImportEventResponse[]>([]);

	const onFormSubmit = async ({ runs }: ImportRunsFormValues) => {
		const results = await importRuns(runs).unwrap();

		setStep('result');
		setCeleryTasks(results);
	};

	const onFormClose = () => {
		setStep('form');
		setCeleryTasks([]);
	};

	return { step, onFormClose, onFormSubmit, celeryTasks };
};

export const ImportRunFormContainer = () => {
	const { step, onFormClose, onFormSubmit, celeryTasks } = useImportTasks();

	return (
		<ImportRunFormModal onClose={onFormClose}>
			{step === 'form' && <ImportRunForm onImportRunsSubmit={onFormSubmit} />}
			{step === 'result' && <RunImportResult results={celeryTasks} />}
		</ImportRunFormModal>
	);
};
