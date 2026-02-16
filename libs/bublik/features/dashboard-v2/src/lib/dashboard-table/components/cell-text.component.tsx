/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { cn } from '@/shared/tailwind-ui';

export interface CellTextProps {
	value: string | number;
	className?: string;
}

export const CellText = ({ value, className }: CellTextProps) => {
	return (
		<span className={cn('block min-w-0 truncate', className)}>{value}</span>
	);
};
