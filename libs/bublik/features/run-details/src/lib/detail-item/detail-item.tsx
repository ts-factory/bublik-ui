/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { ReactNode } from 'react';

import { useCopyToClipboard } from '@/shared/hooks';
import { cn, Icon, toast } from '@/shared/tailwind-ui';

export interface RunDetailsLabelProps {
	label: string;
	value?: string | number | ReactNode | null;
	isCopyable?: boolean;
}

export const DetailItem = ({
	label,
	value,
	isCopyable
}: RunDetailsLabelProps) => {
	const [, copy] = useCopyToClipboard();
	const displayValue = value === null ? '-' : value;

	const canCopy =
		isCopyable &&
		value !== null &&
		value !== undefined &&
		(typeof value === 'string' || typeof value === 'number');

	const handleCopy = () => {
		if (!canCopy) return;
		copy(String(value)).then((success) => {
			if (success) {
				toast.success('Copied to clipboard');
			} else {
				toast.error('Failed to copy to clipboard');
			}
		});
	};

	return (
		<>
			<dt className="text-[0.6875rem] font-medium leading-[0.875rem] text-text-menu">
				{label}
			</dt>
			<dd
				className={cn(
					'text-[0.6875rem] font-medium leading-[0.875rem] flex items-center gap-1 group',
					canCopy && 'cursor-pointer hover:text-primary'
				)}
				onClick={handleCopy}
			>
				{displayValue}
				{canCopy && (
					<Icon
						name="PaperStack"
						size={14}
						className="opacity-0 group-hover:opacity-100 transition-opacity text-primary"
					/>
				)}
			</dd>
		</>
	);
};
