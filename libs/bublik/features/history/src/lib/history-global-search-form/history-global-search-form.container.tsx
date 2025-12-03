/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';

import { useMount, useUnmount } from '@/shared/hooks';

import { HistoryGlobalSearchFormButton } from './history-global-search-button.component';
import {
	getResultTypeState,
	selectIsGlobalSearchFormOpen,
	useHistoryActions,
	useHistoryFormSearchState
} from '../slice';
import { HistoryGlobalSearchFormValues } from './global-search-form';
import { formToSearchState } from '../slice/history-slice.utils';

export const HistoryGlobalSearchFormContainer = () => {
	const actions = useHistoryActions();
	const isGlobalSearchFormOpen = useSelector(selectIsGlobalSearchFormOpen);
	const { form, handleFormChange, handleGlobalSearchSubmit } =
		useHistoryFormSearchState();
	const locationState = useLocation().state as { fromRun?: boolean };

	const close = useCallback(
		() => actions.toggleIsGlobalSearchOpen(false),
		[actions]
	);

	const handleOpenChange = useCallback(
		(isOpen: boolean) => actions.toggleIsGlobalSearchOpen(isOpen),
		[actions]
	);

	const handleFormSubmit = useCallback(
		(form: HistoryGlobalSearchFormValues) => {
			handleGlobalSearchSubmit(form);
			const otherForm = formToSearchState(form);

			actions.updateLinearGlobalFilter({
				parameters: otherForm.parameters,
				tags: otherForm.runData,
				verdicts: otherForm.verdict,
				...getResultTypeState(otherForm.results, otherForm.resultProperties)
			});
			close();
		},
		[actions, close, handleGlobalSearchSubmit]
	);

	useMount(() => {
		if (locationState?.fromRun) {
			actions.toggleIsGlobalSearchOpen(true);
		}
	});
	useUnmount(() => actions.toggleIsGlobalSearchOpen(false));

	return (
		<HistoryGlobalSearchFormButton
			defaultValues={form}
			isGlobalSearchOpen={isGlobalSearchFormOpen}
			onClose={close}
			onOpenChange={handleOpenChange}
			onFormChange={handleFormChange}
			onSubmit={handleFormSubmit}
		/>
	);
};
