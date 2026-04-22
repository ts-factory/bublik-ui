/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useRef, useState } from 'react';
import { z } from 'zod';

import { analyticsEventNames, trackEvent } from '@/bublik/features/analytics';
import { ImportRunsJobResponse, ImportRunsFormValues } from '@/shared/types';
import { bublikAPI, useImportRunsMutation } from '@/services/bublik-api';
import { setErrorsOnForm } from '@/shared/utils';

import {
	ImportRunForm,
	ImportRunFormHandle
} from './import-run-form.component';
import { ImportRunFormModal } from './import-run-form-modal.component';
import { RunImportResult } from './import-run-form-result-list.component';

type FormState = 'form' | 'result';

export const useImportTasks = () => {
	const [importRuns] = useImportRunsMutation();
	const [step, setStep] = useState<FormState>('form');
	const [importJobs, setImportJobs] = useState<ImportRunsJobResponse[]>([]);
	const importFormRef = useRef<ImportRunFormHandle>(null);

	const onFormSubmit = async ({ runs }: ImportRunsFormValues) => {
		const form = importFormRef.current?.form;
		if (!form) return;

		try {
			const onlyUrls = runs.filter(
				(run) => z.string().url().safeParse(run.url).success
			);

			trackEvent(analyticsEventNames.importRunsSubmit, {
				providedRunsCount: runs.length,
				validRunsCount: onlyUrls.length
			});

			if (!onlyUrls.length) {
				form.setError('root', {
					message: 'You must enter at least one valid URL'
				});
				return;
			}

			const results = await importRuns(onlyUrls).unwrap();

			const taskCount = results.reduce(
				(sum, job) => sum + job.job_tasks_data.length,
				0
			);

			trackEvent(analyticsEventNames.importRunsSubmit, {
				providedRunsCount: runs.length,
				validRunsCount: onlyUrls.length,
				status: 'success',
				taskCount
			});

			setStep('result');
			setImportJobs(results);
		} catch (e: unknown) {
			trackEvent(analyticsEventNames.importRunsSubmit, {
				providedRunsCount: runs.length,
				status: 'error'
			});

			setErrorsOnForm(e, { handle: form });
		}
	};

	const onFormClose = () => {
		setStep('form');
		setImportJobs([]);
	};

	return { step, onFormClose, onFormSubmit, importJobs, importFormRef };
};

export const ImportRunFormContainer = () => {
	const { step, onFormClose, onFormSubmit, importJobs, importFormRef } =
		useImportTasks();
	const { data, error, isLoading } = bublikAPI.useGetAllProjectsQuery();

	return (
		<ImportRunFormModal onClose={onFormClose}>
			{step === 'form' && !error && !isLoading && data && (
				<ImportRunForm
					projects={data}
					onImportRunsSubmit={onFormSubmit}
					ref={importFormRef}
				/>
			)}
			{step === 'result' && <RunImportResult results={importJobs} />}
		</ImportRunFormModal>
	);
};
