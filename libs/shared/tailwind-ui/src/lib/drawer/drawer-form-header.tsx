/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { ReactNode } from 'react';

import { DialogClose } from '../dialog';
import { Icon } from '../icon';

export interface DrawerFormHeaderProps {
	name: string;
	description?: string;
	onClose: () => void;
	/** Extra actions, placed to the left of the close button. */
	children?: ReactNode;
}

/**
 * Title, description and close button for a form drawer.
 *
 * The app has two of these — history global search and classify failure — and
 * they were drifting apart a class string at a time. The close button in
 * particular had two definitions that agreed on everything except a stray
 * margin. One definition now, so they can't.
 *
 * Outer padding stays with the caller: the search form indents its header to
 * meet its `FormSection` cards, the classify drawer doesn't have any.
 */
export function DrawerFormHeader({
	name,
	description,
	onClose,
	children
}: DrawerFormHeaderProps) {
	return (
		<div className="flex items-center justify-between gap-4">
			<div className="flex flex-col gap-1">
				<span className="text-[1.125rem] font-semibold leading-6 text-text-primary">
					{name}
				</span>
				{description ? (
					<span className="text-[0.8125rem] leading-[1.125rem] text-text-secondary">
						{description}
					</span>
				) : null}
			</div>
			<div className="flex items-center gap-1 shrink-0">
				{children}
				<DialogClose
					onClick={onClose}
					aria-label="Close"
					className="p-2 rounded text-text-menu hover:bg-primary-wash hover:text-primary"
				>
					<Icon name="Cross" className="size-4" />
				</DialogClose>
			</div>
		</div>
	);
}
