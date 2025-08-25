/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { KeyboardEvent, useEffect } from 'react';
import { useForm, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { VERDICT_TYPE } from '@/shared/types';

import {
	HistoryGlobalSearchFormValues,
	ValidationSchema
} from './global-search-form.types';
import { HISTORY_CONSTANTS } from './global-search-form.constants';

type UseHistoryGlobalSearchFormConfig = {
	initialValues: HistoryGlobalSearchFormValues;
	onFormChange: (form: HistoryGlobalSearchFormValues) => void;
};

export const useHistoryGlobalSearchForm = (
	config: UseHistoryGlobalSearchFormConfig
) => {
	const { initialValues } = config;

	const methods = useForm<HistoryGlobalSearchFormValues>({
		defaultValues: initialValues,
		resolver: zodResolver(ValidationSchema)
	});

	const resetTestSection = () => {
		methods.reset({ ...methods.getValues(), hash: '', parameters: [] });
	};

	useEffect(() => {
		const subscription = methods.watch((value) =>
			config.onFormChange(value as HistoryGlobalSearchFormValues)
		);
		return () => subscription.unsubscribe();
	}, [config, methods]);

	const resetRunSection = () => {
		methods.reset({
			...methods.getValues(),
			revisions: [],
			revisionExpr: '',
			runData: [],
			runIds: '',
			branchExpr: '',
			labels: [],
			branches: [],
			tagExpr: '',
			runProperties: HISTORY_CONSTANTS.runProperties
		});
	};

	const resetVerdictSection = () => {
		methods.reset({
			...methods.getValues(),
			results: HISTORY_CONSTANTS.results,
			resultProperties: HISTORY_CONSTANTS.resultProperties,
			verdict: [],
			verdictLookup: VERDICT_TYPE.String,
			labelExpr: '',
			verdictExpr: '',
			testArgExpr: ''
		});
	};

	const resetForm = () => {
		resetTestSection();
		resetRunSection();
		resetVerdictSection();
	};

	const handleKeyDown = (e: KeyboardEvent) => {
		if (e.key === 'Enter') e.preventDefault();
	};

	return {
		methods,
		resetForm,
		resetRunSection,
		resetTestSection,
		resetVerdictSection,
		handleKeyDown
	};
};

type UseCtrlEnterSubmitConfig = {
	onSubmit: (form: HistoryGlobalSearchFormValues) => void;
	methods: UseFormReturn<HistoryGlobalSearchFormValues, unknown>;
};

export const useCtrlEnterSubmit = (config: UseCtrlEnterSubmitConfig) => {
	const { onSubmit, methods } = config;

	useEffect(() => {
		const handleSubmitShortcut = (e: globalThis.KeyboardEvent) => {
			if (e.key === 'Enter' && e.ctrlKey) methods.handleSubmit(onSubmit)();
		};

		document?.addEventListener('keydown', handleSubmitShortcut);
		return () => document?.removeEventListener('keydown', handleSubmitShortcut);
	}, [methods, onSubmit]);
};
