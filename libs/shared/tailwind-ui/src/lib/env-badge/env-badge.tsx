/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { FC, useState } from 'react';

import { indentEnv } from '@/shared/utils';

import { cn } from '../utils';
import { Badge } from '../badge';
import { ArrowDown } from './arrow-icon';
import { EnvCard } from './env-card';
import { Popover, PopoverTrigger, PopoverContent } from '../popover';

export interface EnvBadgeProps {
	value: string;
	isSelected?: boolean;
	onContentClick?: () => void;
}

export const EnvBadge: FC<EnvBadgeProps> = (props) => {
	const { value, isSelected, onContentClick } = props;
	const indentedValue = indentEnv(value);
	const [isOpen, setIsOpen] = useState(false);

	if (value.length <= 30) {
		return (
			<Badge
				className="bg-badge-1"
				isSelected={isSelected}
				onClick={onContentClick}
				overflowWrap
			>
				{value}
			</Badge>
		);
	}

	return (
		<Popover onOpenChange={setIsOpen}>
			<PopoverTrigger asChild>
				<Badge
					className="transition-colors cursor-pointer group bg-badge-1"
					isSelected={isSelected}
					overflowWrap
				>
					<div className="flex items-center gap-2">
						env
						<div className="grid place-items-center" aria-label="Expand env">
							<ArrowDown
								className={cn(
									'grid place-items-center group-hover:text-primary',
									isOpen ? 'text-primary' : 'text-text-secondary'
								)}
							/>
						</div>
					</div>
				</Badge>
			</PopoverTrigger>
			<PopoverContent sideOffset={8}>
				<EnvCard
					rawValue={value}
					value={indentedValue}
					onClick={onContentClick}
					isSelected={isSelected}
				/>
			</PopoverContent>
		</Popover>
	);
};
