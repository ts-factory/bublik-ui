/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { PropsWithChildren } from 'react';

import {
	Dialog,
	DialogTrigger,
	DialogClose,
	ModalContent,
	Icon,
	ButtonTw,
	TwScrollArea
} from '@/shared/tailwind-ui';

interface ImportRunFormModalProps {
	onClose?: () => void;
}

function ImportRunFormModal(props: PropsWithChildren<ImportRunFormModalProps>) {
	const handleOpenChange = (open: boolean) => {
		if (!open) setTimeout(() => props.onClose?.(), 300);
	};

	return (
		<Dialog onOpenChange={handleOpenChange}>
			<DialogTrigger asChild>
				<ButtonTw variant="primary" size="md" rounded="lg">
					Import
				</ButtonTw>
			</DialogTrigger>

			<ModalContent className="min-w-[1000px]">
				<TwScrollArea className="bg-white max-h-[85vh] rounded-lg">
					<div className="relative flex items-center justify-end px-6 pt-6">
						<DialogClose className="p-1 rounded hover:bg-primary-wash text-text-menu hover:text-primary">
							<Icon name="Cross" />
						</DialogClose>
					</div>
					<div className="flex-1 px-6 pb-6">{props.children}</div>
				</TwScrollArea>
			</ModalContent>
		</Dialog>
	);
}

export { ImportRunFormModal, type ImportRunFormModalProps };
