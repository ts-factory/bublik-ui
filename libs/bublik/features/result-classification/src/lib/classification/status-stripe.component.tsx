/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { Icon, Tooltip, cn } from '@/shared/tailwind-ui';
import type { IconProps } from '@/shared/tailwind-ui';

export interface StatusStripeMeta {
	label: string;
	displayValue?: string;
	description: string;
	stripeClassName: string;
	iconName: IconProps['name'];
}

export function StatusStripe({ meta }: { meta: StatusStripeMeta }) {
	const label = meta.displayValue ?? meta.label;

	return (
		<Tooltip content={`${label} — ${meta.description}`}>
			<div
				className={cn(
					'absolute -inset-y-px -left-px right-0 rounded-l-md',
					'flex items-center justify-center',
					meta.stripeClassName
				)}
				data-testid="status-stripe"
				data-status={label}
			>
				<Icon name={meta.iconName} size={16} />
			</div>
		</Tooltip>
	);
}

export const STATUS_STRIPE_COLUMN_META = {
	width: '24px',
	className: 'p-0',
	cellClassName: 'relative overflow-visible'
} as const;
