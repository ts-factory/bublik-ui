/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { FormProvider } from 'react-hook-form';

import { ButtonTw, Icon } from '@/shared/tailwind-ui';

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
import { useIsScrollbarVisible } from '@/shared/hooks';

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
			className="w-[768px] h-full overflow-auto styled-scrollbar"
			ref={scrollableRef}
		>
			<FormProvider {...form.methods}>
				<form
					onSubmit={form.methods.handleSubmit(onSubmit)}
					onKeyDown={form.handleKeyDown}
					className="flex flex-col justify-between h-full gap-2 [&>*]:px-6"
				>
					<MainFormHeader onCloseButtonClick={onCloseButtonClick} />
					<TestSection onResetTestSectionResetClick={form.resetTestSection} />
					<RunSection onResetRunSectionClick={form.resetRunSection} />
					<ResultSection onResultSectionClick={form.resetVerdictSection} />
					<VerdictSection />
					<StickySubmit
						onResetClick={form.resetForm}
						isScrollable={isVisible}
					/>
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
		<div className="mb-2 mt-7">
			<FormHeader name="Global Search">
				<button
					className="p-[5.5px] bg-transparent hover:bg-primary-wash hover:text-primary text-text-menu rounded transition-colors"
					aria-label="Close"
					onClick={props.onCloseButtonClick}
				>
					<Icon name="Cross" size={11} />
				</button>
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
			className="sticky bottom-0 flex items-center w-full gap-4 py-4 mt-2 bg-white"
			style={
				props.isScrollable
					? { boxShadow: 'rgba(0, 0, 0, 0.1) 0px 0px 15px 0px' }
					: undefined
			}
		>
			<ButtonTw
				size="md"
				rounded="lg"
				variant="primary"
				type="submit"
				className="justify-center w-full"
			>
				Submit
			</ButtonTw>
			<ButtonTw
				type="button"
				variant="outline"
				size="md"
				className="justify-center w-full"
				onClick={props.onResetClick}
			>
				Reset
			</ButtonTw>
		</div>
	);
};
