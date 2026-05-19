/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useRef, useState } from 'react';
import { z } from 'zod';
import type { Path } from 'react-hook-form';

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
type ImportRunsErrorPath = Path<ImportRunsFormValues> | 'root';

type ImportRunsIndexedError = {
	failedRunIndex?: number;
	data?: {
		messages?: string | string[] | Record<string, string | string[]>;
	};
	description?: string;
	failedRunErrors?: ImportRunsIndexedError[];
};

const isImportRunsBatchError = (
	error: unknown
): error is ImportRunsIndexedError => {
	return (
		typeof error === 'object' &&
		error !== null &&
		'failedRunErrors' in error &&
		Array.isArray(error.failedRunErrors)
	);
};

const getImportRunErrorPath = (
	field: string,
	runIndex: number
): ImportRunsErrorPath => {
	if (field === 'url') return `runs.${runIndex}.url`;

	return 'root';
};

const getFirstMessage = (message: string | string[]) =>
	Array.isArray(message) ? message[0] ?? 'Unknown error!' : message;

export const useImportTasks = () => {
	const [importRuns, { isLoading: isImporting }] = useImportRunsMutation();
	const [step, setStep] = useState<FormState>('form');
	const [importJobs, setImportJobs] = useState<ImportRunsJobResponse[]>([]);
	const importFormRef = useRef<ImportRunFormHandle>(null);

	const onFormSubmit = async ({ runs }: ImportRunsFormValues) => {
		const form = importFormRef.current?.form;
		if (!form) return;

		const validRunIndexes = runs.reduce<number[]>(
			(indexes, run, index) =>
				z.string().url().safeParse(run.url).success
					? [...indexes, index]
					: indexes,
			[]
		);
		const onlyUrls = validRunIndexes.map((index) => runs[index]);

		try {
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

			if (!isImportRunsBatchError(e)) {
				setErrorsOnForm(e, { handle: form });
				return;
			}

			e.failedRunErrors?.forEach((requestError) => {
				const messages = requestError.data?.messages;

				if (typeof messages === 'string' || Array.isArray(messages)) {
					form.setError('root', {
						type: 'custom',
						message: getFirstMessage(messages)
					});
					return;
				}

				if (!messages) {
					form.setError('root', {
						type: 'custom',
						message: requestError.description ?? 'Unknown error!'
					});
					return;
				}

				Object.entries(messages).forEach(([field, message]) => {
					const runIndex =
						typeof requestError.failedRunIndex === 'number'
							? validRunIndexes[requestError.failedRunIndex]
							: undefined;
					const path =
						runIndex == null ? 'root' : getImportRunErrorPath(field, runIndex);

					form.setError(path, {
						type: 'custom',
						message: getFirstMessage(message)
					});
				});
			});
		}
	};

	const onFormClose = () => {
		setStep('form');
		setImportJobs([]);
	};

	return {
		step,
		onFormClose,
		onFormSubmit,
		importJobs,
		importFormRef,
		isImporting
	};
};

export const ImportRunFormContainer = () => {
	const {
		step,
		onFormClose,
		onFormSubmit,
		importJobs,
		importFormRef,
		isImporting
	} = useImportTasks();
	const { data, error, isLoading } = bublikAPI.useGetAllProjectsQuery();

	return (
		<ImportRunFormModal onClose={onFormClose} preventClose={isImporting}>
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
