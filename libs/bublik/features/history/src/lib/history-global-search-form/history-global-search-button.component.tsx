/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import {
	DrawerRoot,
	Icon,
	ButtonTw,
	DrawerTrigger,
	DrawerContent
} from '@/shared/tailwind-ui';

import { HistoryGlobalSearchFormValues } from './global-search-form';
import { GlobalSearchForm } from './global-search-form';

export interface HistoryGlobalSearchProps {
	defaultValues?: HistoryGlobalSearchFormValues;
	onSubmit?: (form: HistoryGlobalSearchFormValues) => void;
	isGlobalSearchOpen?: boolean;
	onClose?: () => void;
	onOpenChange?: (isOpen: boolean) => void;
	onFormChange: (form: HistoryGlobalSearchFormValues) => void;
}

export const HistoryGlobalSearchFormButton = (
	props: HistoryGlobalSearchProps
) => {
	const {
		defaultValues,
		onSubmit,
		onClose,
		isGlobalSearchOpen,
		onOpenChange,
		onFormChange
	} = props;

	const handleSubmit = (form: HistoryGlobalSearchFormValues) => {
		onSubmit?.(form);
	};

	const handleCloseClick = () => onClose?.();

	return (
		<DrawerRoot open={isGlobalSearchOpen} onOpenChange={onOpenChange}>
			<DrawerTrigger asChild>
				<ButtonTw
					variant="outline"
					size="md"
					rounded="lg"
					className="border-border-primary bg-white hover:border-primary hover:bg-primary-wash"
				>
					<div className="flex items-center gap-2">
						<Icon name="GlobalSearch" className="grid place-items-center" />
						<span className="text-[0.875rem] leading-[1.5rem]">
							Edit Search
						</span>
					</div>
				</ButtonTw>
			</DrawerTrigger>
			<DrawerContent onEscapeKeyDown={onClose}>
				<GlobalSearchForm
					initialValues={defaultValues}
					onSubmit={handleSubmit}
					onCloseButtonClick={handleCloseClick}
					onFormChange={onFormChange}
				/>
			</DrawerContent>
		</DrawerRoot>
	);
};
