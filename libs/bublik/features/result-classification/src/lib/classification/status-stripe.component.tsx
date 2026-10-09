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

export interface StatusStripeProps {
	meta: StatusStripeMeta;
	/**
	 * Fade the stripe and say why in the tooltip. For a row whose colour still
	 * describes it but no longer *acts* — an inactive rule keeps its disposition,
	 * yet stamps nothing new — so the colour is not mistaken for something in
	 * force.
	 */
	muted?: string;
}

export function StatusStripe({ meta, muted }: StatusStripeProps) {
	const label = meta.displayValue ?? meta.label;
	const content = muted
		? `${muted} — ${label}: ${meta.description}`
		: `${label} — ${meta.description}`;

	return (
		<Tooltip content={content}>
			<div
				className={cn(
					'absolute -inset-y-px -left-px right-0 rounded-l-md',
					'flex items-center justify-center',
					meta.stripeClassName,
					muted && 'opacity-40'
				)}
				data-testid="status-stripe"
				data-status={label}
				data-muted={muted ? 'true' : undefined}
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
