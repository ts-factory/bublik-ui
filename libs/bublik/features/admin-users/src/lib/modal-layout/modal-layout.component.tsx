/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { PropsWithChildren } from 'react';

import { DialogClose, Icon, ModalContent } from '@/shared/tailwind-ui';

export interface UsersModalLayoutProps {
	label: string;
}

export const UsersModalLayout = (
	props: PropsWithChildren<UsersModalLayoutProps>
) => {
	return (
		<ModalContent className="w-full sm:max-w-md p-6 bg-white sm:rounded-lg md:shadow min-w-[420px] z-10 relative overflow-auto max-h-[85vh]">
			<DialogClose className="absolute grid p-1 transition-colors rounded-md right-4 top-4 place-items-center text-text-menu hover:bg-primary-wash hover:text-primary">
				<Icon name={'Cross'} size={14} />
			</DialogClose>
			<h1 className="mb-6 text-2xl font-bold leading-tight tracking-tight text-text-primary">
				{props.label}
			</h1>
			{props.children}
		</ModalContent>
	);
};
