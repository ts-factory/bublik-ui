/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { Tooltip } from '@/shared/tailwind-ui';

export interface DescriptionCellProps {
	value: string | null | undefined;
}

export function DescriptionCell({ value }: DescriptionCellProps) {
	const text = value?.trim();

	if (!text) return null;

	return (
		<Tooltip content={text}>
			<span className="block min-w-0 whitespace-pre-wrap break-words line-clamp-3 text-text-primary">
				{text}
			</span>
		</Tooltip>
	);
}
