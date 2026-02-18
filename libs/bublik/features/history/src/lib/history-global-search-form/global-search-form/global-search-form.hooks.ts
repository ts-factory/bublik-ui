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
		methods.reset({
			...methods.getValues(),
			testName: '',
			hash: '',
			parameters: [],
			testArgExpr: ''
		});
	};

	const resetTestSectionToDefault = () => {
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
			dates: undefined,
			revisions: [],
			revisionExpr: '',
			runData: [],
			runIds: '',
			branchExpr: '',
			labelExpr: '',
			labels: [],
			branches: [],
			tagExpr: '',
			runProperties: []
		});
	};

	const resetRunSectionToDefault = () => {
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

	const resetResultSection = () => {
		methods.reset({
			...methods.getValues(),
			results: [],
			resultProperties: []
		});
	};

	const resetResultSectionToDefault = () => {
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

	const resetVerdictSection = () => {
		methods.reset({
			...methods.getValues(),
			verdict: [],
			verdictLookup: VERDICT_TYPE.None,
			verdictExpr: ''
		});
	};

	const resetVerdictSectionToDefault = () => {
		methods.reset({
			...methods.getValues(),
			verdict: [],
			verdictLookup: VERDICT_TYPE.String,
			verdictExpr: ''
		});
	};

	const resetForm = () => {
		resetTestSectionToDefault();
		resetRunSectionToDefault();
		resetResultSectionToDefault();
		resetVerdictSectionToDefault();
	};

	const handleKeyDown = (e: KeyboardEvent) => {
		if (e.key === 'Enter') e.preventDefault();
	};

	return {
		methods,
		resetForm,
		resetResultSection,
		resetResultSectionToDefault,
		resetRunSection,
		resetRunSectionToDefault,
		resetTestSection,
		resetTestSectionToDefault,
		resetVerdictSection,
		resetVerdictSectionToDefault,
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
			if (e.key !== 'Enter') return;
			if (!e.ctrlKey && !e.metaKey) return;
			if (e.isComposing || e.repeat) return;

			e.preventDefault();
			methods.handleSubmit(onSubmit)();
		};

		document?.addEventListener('keydown', handleSubmitShortcut);
		return () => document?.removeEventListener('keydown', handleSubmitShortcut);
	}, [methods, onSubmit]);
};
