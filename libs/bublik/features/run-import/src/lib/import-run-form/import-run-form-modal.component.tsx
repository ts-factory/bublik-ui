/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { PropsWithChildren, useState } from 'react';

import { analyticsEventNames, trackEvent } from '@/bublik/features/analytics';
import {
	Dialog,
	DialogTrigger,
	ModalContent,
	ButtonTw,
	TwScrollArea,
	Icon,
	Tooltip,
	DialogClose,
	toast
} from '@/shared/tailwind-ui';

const CLOSE_BLOCKED_TOAST_ID = 'import-runs-close-blocked';

interface ImportRunFormModalProps {
	onClose?: () => void;
	preventClose?: boolean;
}

function ImportRunFormModal(props: PropsWithChildren<ImportRunFormModalProps>) {
	const [open, setOpen] = useState(false);

	const handleOpenChange = (open: boolean) => {
		if (!open && props.preventClose) {
			toast.warning(
				'Import is still in progress. Please wait until it finishes.',
				{ id: CLOSE_BLOCKED_TOAST_ID }
			);
			return;
		}

		setOpen(open);

		if (open) {
			trackEvent(analyticsEventNames.importModalOpen, {
				source: 'import_page'
			});
		}

		if (!open) setTimeout(() => props.onClose?.(), 300);
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogTrigger asChild>
				<ButtonTw variant="outline" size="md" rounded="lg">
					<Icon name="FilePlus" size={24} className="mr-1.5 text-primary" />
					<span>Import</span>
				</ButtonTw>
			</DialogTrigger>

			<ModalContent className="min-w-[1000px]">
				<TwScrollArea className="bg-white max-h-[85vh] rounded-lg p-6">
					<Tooltip content="Close">
						<DialogClose asChild>
							<ButtonTw
								variant="ghost"
								className="absolute top-4 right-4 p-1.5 hover:text-primary text-text-menu"
								aria-label="Close Import Dialog"
							>
								<Icon name="Cross" size={14} />
							</ButtonTw>
						</DialogClose>
					</Tooltip>
					<div className="flex-1 flex flex-col gap-4">{props.children}</div>
				</TwScrollArea>
			</ModalContent>
		</Dialog>
	);
}

export { ImportRunFormModal, type ImportRunFormModalProps };
