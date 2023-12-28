/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { ComponentPropsWithRef, FC, forwardRef } from 'react';

import { Icon } from '../icon';

export type SearchBarProps = ComponentPropsWithRef<'input'>;

export const SearchBar: FC<SearchBarProps> = forwardRef((props, ref) => {
	return (
		<div className="relative" ref={ref} data-testid="tw-search-bar">
			<Icon
				name="MagnifyingGlass"
				className="absolute top-2 left-2.5 text-primary"
			/>
			<input
				className="py-[7px] pr-1.5 pl-12 text-text-secondary text-[0.875rem] font-medium leading-[1.5rem] transition-all border border-border-primary shadow-none outline-none rounded-md focus:outline-none focus:ring-0 focus:border-primary focus:shadow-[0_0_0_3px_rgba(98,126,251,0.1)] hover:border-primary active:shadow-none placeholder:text-text-menu"
				autoComplete="off"
				{...props}
			/>
		</div>
	);
});
