/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024 OKTET LTD */
import { ComponentPropsWithoutRef } from 'react';

import { Icon, Tooltip, Separator } from '@/shared/tailwind-ui';

function CurrentBadge() {
	return (
		<div className="bg-purple-100 text-purple-800 px-2.5 py-0.5 rounded text-[0.6875rem] font-medium">
			ACTIVE
		</div>
	);
}

function InactiveBadge() {
	return (
		<div className="text-[0.6875rem] bg-gray-200 text-gray-900 text-xs font-medium me-2 px-2.5 py-0.5 rounded">
			INACTIVE
		</div>
	);
}

function ModifiedBadge(props: ComponentPropsWithoutRef<'button'>) {
	return (
		<div className="bg-indigo-100 text-indigo-800 pl-2.5 pr-1.5 py-0.5 rounded text-[0.6875rem] font-medium flex items-center">
			<span>MODIFIED</span>
			<Separator
				orientation="vertical"
				className="h-[14px] bg-indigo-800 mx-1.5"
			/>
			<Tooltip content="Remove modifications">
				<button
					aria-label="Reset To Original"
					className="hover:bg-indigo-500 rounded hover:text-white relative"
					{...props}
				>
					<Icon name="Refresh" className="size-5 scale-x-[-1]" />
				</button>
			</Tooltip>
		</div>
	);
}

export { CurrentBadge, InactiveBadge, ModifiedBadge };
