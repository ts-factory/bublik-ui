/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { FormProvider } from 'react-hook-form';

import { useIsScrollbarVisible } from '@/shared/hooks';
import { ButtonTw, DialogClose, Icon, cn } from '@/shared/tailwind-ui';

import {
	HistoryGlobalSearchFormValues,
	defaultValues
} from './global-search-form.types';
import {
	useCtrlEnterSubmit,
	useHistoryGlobalSearchForm
} from './global-search-form.hooks';
import { FormHeader } from './components';
import {
	TestSection,
	RunSection,
	ResultSection,
	VerdictSection
} from './sections';

export interface GlobalSearchFormProps {
	initialValues?: HistoryGlobalSearchFormValues;
	onSubmit: (form: HistoryGlobalSearchFormValues) => void;
	onCloseButtonClick: () => void;
	onFormChange: (form: HistoryGlobalSearchFormValues) => void;
}

export const GlobalSearchForm = (props: GlobalSearchFormProps) => {
	const {
		onSubmit,
		initialValues = defaultValues,
		onCloseButtonClick,
		onFormChange
	} = props;

	const form = useHistoryGlobalSearchForm({ initialValues, onFormChange });

	useCtrlEnterSubmit({ methods: form.methods, onSubmit });

	const [scrollableRef, isVisible] = useIsScrollbarVisible<HTMLDivElement>();

	return (
		<div
			className="h-full w-screen max-w-[48rem] overflow-auto bg-white styled-scrollbar"
			ref={scrollableRef}
		>
			<FormProvider {...form.methods}>
				<form
					onSubmit={form.methods.handleSubmit(onSubmit)}
					onKeyDown={form.handleKeyDown}
					className="flex h-full flex-col gap-6 pt-2 pb-2"
				>
					<MainFormHeader onCloseButtonClick={onCloseButtonClick} />
					<div className="flex h-full flex-col gap-6 px-4 md:px-6">
						<TestSection
							onResetTestSectionClick={form.resetTestSection}
							onResetTestSectionDefaultClick={form.resetTestSectionToDefault}
						/>
						<RunSection
							onResetRunSectionClick={form.resetRunSection}
							onResetRunSectionDefaultClick={form.resetRunSectionToDefault}
						/>
						<ResultSection
							onResetResultSectionClick={form.resetResultSection}
							onResetResultSectionDefaultClick={
								form.resetResultSectionToDefault
							}
						/>
						<VerdictSection
							onResetVerdictSectionClick={form.resetVerdictSection}
						/>
						<StickySubmit
							onResetClick={form.resetForm}
							isScrollable={isVisible}
						/>
					</div>
				</form>
			</FormProvider>
		</div>
	);
};

type MainFormHeaderProps = {
	onCloseButtonClick: () => void;
};

const MainFormHeader = (props: MainFormHeaderProps) => {
	return (
		<div className="py-2 pb-4 px-11 border-b border-border-primary">
			<FormHeader
				name="Global Search"
				description="Combine test, run, result, and verdict filters to narrow down history."
			>
				<DialogClose
					onClick={props.onCloseButtonClick}
					className="rounded hover:bg-primary-wash p-2 hover:text-primary text-text-menu"
				>
					<Icon name="Cross" className="size-4" />
				</DialogClose>
			</FormHeader>
		</div>
	);
};

type StickySubmitProps = {
	onResetClick: () => void;
	isScrollable: boolean;
};

const StickySubmit = (props: StickySubmitProps) => {
	return (
		<div
			className={cn(
				'sticky bottom-0 z-20 mt-auto -mx-4 bg-white px-4 py-4 backdrop-blur-sm md:-mx-6 md:px-6',
				props.isScrollable && 'shadow-sticky'
			)}
		>
			<div className="flex flex-col gap-3 sm:flex-row">
				<ButtonTw
					size="md"
					rounded="lg"
					variant="primary"
					type="submit"
					className="justify-center w-full"
				>
					<Icon name="MagnifyingGlass" className="mr-1.5 size-5" />
					<span>Apply Search</span>
				</ButtonTw>
				<ButtonTw
					type="button"
					variant="outline"
					size="md"
					className="justify-center w-full"
					onClick={props.onResetClick}
				>
					<Icon name="Refresh" className="mr-1.5 size-5 -scale-x-90" />
					<span>Reset</span>
				</ButtonTw>
			</div>
			<div className="mt-2 text-[0.75rem] leading-4 text-text-menu">
				Tip: press Ctrl/Cmd + Enter to submit
			</div>
		</div>
	);
};
