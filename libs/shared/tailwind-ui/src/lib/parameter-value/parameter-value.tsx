/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { FC, useState } from 'react';

import { useCopyToClipboard } from '@/shared/hooks';
import {
	DEFAULT_KEY_VALUE_DISPLAY_DELIMITER,
	DEFAULT_KEY_VALUE_SUBMIT_DELIMITER,
	formatParameterValue,
	isPreformattedParameterValue,
	joinKeyValue
} from '@/shared/utils';

import { cn, toast } from '../utils';
import { Badge } from '../badge';
import { Icon } from '../icon';
import { Popover, PopoverTrigger, PopoverContent } from '../popover';
import { ArrowDown } from './arrow-icon';
import { ParameterCard } from './parameter-card';

/**
 * `badge` keeps the parameter on a single line: a preformatted value collapses
 * into a `name ⌄` badge that opens a popover with the formatted value.
 *
 * `pre` renders a preformatted value inline as an indented block, the way the
 * session log meta block does. Use it where the parameter has a full row to
 * itself, not in a dense single-line header.
 */
export type ParameterValueMode = 'badge' | 'pre';

export interface ParameterValueProps {
	name: string;
	/** Empty for a parameter carrying no value, e.g. a bare tag. */
	value?: string;
	mode?: ParameterValueMode;
	isSelected?: boolean;
	onClick?: () => void;
	className?: string;
	displayDelimiter?: string;
	submitDelimiter?: string;
}

export const isPreformattedParameter = (value: string) =>
	isPreformattedParameterValue(value);

export const ParameterValue: FC<ParameterValueProps> = (props) => {
	const {
		name,
		value = '',
		mode = 'badge',
		isSelected,
		onClick,
		className,
		displayDelimiter = DEFAULT_KEY_VALUE_DISPLAY_DELIMITER,
		submitDelimiter = DEFAULT_KEY_VALUE_SUBMIT_DELIMITER
	} = props;

	if (!isPreformattedParameterValue(value)) {
		return (
			<Badge
				className={className}
				isSelected={isSelected}
				onClick={onClick}
				overflowWrap
			>
				{joinKeyValue(name, value, displayDelimiter)}
			</Badge>
		);
	}

	const rawValue = joinKeyValue(name, value, submitDelimiter);
	const formattedValue = formatParameterValue(value);

	const label = `${name}${displayDelimiter.trimEnd()}`;

	if (mode === 'pre') {
		return (
			<ParameterBlock
				name={name}
				label={label}
				rawValue={rawValue}
				formattedValue={formattedValue}
				isSelected={isSelected}
				onClick={onClick}
				className={className}
			/>
		);
	}

	return (
		<CollapsedParameter
			name={name}
			label={label}
			rawValue={rawValue}
			formattedValue={formattedValue}
			isSelected={isSelected}
			onClick={onClick}
			className={className}
		/>
	);
};

interface PreformattedParameterProps {
	name: string;
	/** Parameter name suffixed with the configured display delimiter. */
	label: string;
	rawValue: string;
	formattedValue: string;
	isSelected?: boolean;
	onClick?: () => void;
	className?: string;
}

function CollapsedParameter(props: PreformattedParameterProps) {
	const {
		name,
		label,
		rawValue,
		formattedValue,
		isSelected,
		onClick,
		className
	} = props;
	const [isOpen, setIsOpen] = useState(false);

	return (
		<Popover onOpenChange={setIsOpen}>
			<PopoverTrigger asChild>
				<Badge
					className={cn('transition-colors cursor-pointer group', className)}
					isSelected={isSelected}
					overflowWrap
				>
					<div className="flex items-center gap-2">
						{label}
						<div
							className="grid place-items-center"
							aria-label={`Expand ${name}`}
						>
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
				<ParameterCard
					rawValue={rawValue}
					value={formattedValue}
					onClick={onClick}
					isSelected={isSelected}
				/>
			</PopoverContent>
		</Popover>
	);
}

function ParameterBlock(props: PreformattedParameterProps) {
	const {
		name,
		label,
		rawValue,
		formattedValue,
		isSelected,
		onClick,
		className
	} = props;
	const [, copy] = useCopyToClipboard();

	function handleCopy() {
		copy(rawValue).then((isSuccess) => {
			if (isSuccess) {
				toast.success('Copied to clipboard');
			} else {
				toast.error('Failed to copy to clipboard');
			}
		});
	}

	return (
		<div
			className={cn(
				'group relative w-full rounded border border-transparent text-[0.75rem]',
				className ?? 'bg-badge-1',
				isSelected && 'bg-primary-wash border-primary',
				onClick && 'cursor-pointer'
			)}
			onClick={onClick}
			data-testid="tw-parameter-block"
		>
			<div className="flex items-center justify-between gap-2 px-2 pt-1">
				<span className="font-medium leading-[1.125rem]">{label}</span>
				<button
					type="button"
					aria-label={`Copy ${name}`}
					className="rounded-md hover:bg-primary-wash"
					onClick={(event) => {
						event.stopPropagation();
						handleCopy();
					}}
				>
					<Icon
						name="PaperStack"
						size={20}
						className="opacity-0 group-hover:opacity-100 transition-opacity text-primary shrink-0"
					/>
				</button>
			</div>
			<pre className="px-2 pb-1 text-[0.75rem] font-mono max-h-64 overflow-auto">
				{formattedValue}
			</pre>
		</div>
	);
}
