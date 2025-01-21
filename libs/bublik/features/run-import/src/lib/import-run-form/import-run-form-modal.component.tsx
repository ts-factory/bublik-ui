/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { PropsWithChildren } from 'react';

import {
	Dialog,
	DialogTrigger,
	ModalContent,
	ButtonTw,
	TwScrollArea,
	Icon,
	Tooltip,
	DialogClose
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
							>
								<Icon name="Cross" size={14} />
							</ButtonTw>
						</DialogClose>
					</Tooltip>
					<div className="flex-1">{props.children}</div>
				</TwScrollArea>
			</ModalContent>
		</Dialog>
	);
}

export { ImportRunFormModal, type ImportRunFormModalProps };
