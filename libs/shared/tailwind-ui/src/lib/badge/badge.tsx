/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { ElementType, forwardRef } from 'react';

import { PolymorphicComponentPropWithRef, PolymorphicRef } from '../types';
import { cva, cn, VariantProps } from '../utils';

export const enum BadgeVariants {
	Primary = 'primary',
	Transparent = 'transparent',
	Expected = 'expected',
	Unexpected = 'unexpected',
	PrimaryActive = 'primary-active',
	ExpectedActive = 'expected-active',
	UnexpectedActive = 'unexpected-active'
}

export const badgeBaseStyles = cva({
	base: [
		'inline-flex',
		'items-center',
		'w-fit',
		'py-0.5',
		'px-2',
		'rounded',
		'border',
		'border-transparent',
		'leading-[1.125rem]',
		'text-[0.75rem]',
		'font-medium',
		'transition-colors'
	]
});

export const badgeVariantStyles = cva({
	variants: {
		variant: {
			[BadgeVariants.Transparent]: 'bg-transparent border-border-primary',
			[BadgeVariants.Primary]: 'bg-badge-0',
			[BadgeVariants.PrimaryActive]: 'bg-badge-9',
			[BadgeVariants.Expected]: 'text-text-expected bg-badge-3',
			[BadgeVariants.ExpectedActive]: 'bg-badge-3',
			[BadgeVariants.Unexpected]: 'bg-bg-fillError text-text-unexpected',
			[BadgeVariants.UnexpectedActive]: 'bg-bg-fillError'
		}
	}
});

export const badgeSelectedStyles = cva({
	variants: {
		variant: {
			[BadgeVariants.Transparent]: 'bg-primary-wash border-primary',
			[BadgeVariants.Primary]: 'bg-primary-wash border-primary',
			[BadgeVariants.Expected]: 'border-text-expected',
			[BadgeVariants.Unexpected]: 'border-text-unexpected',
			[BadgeVariants.PrimaryActive]: 'text-white bg-primary',
			[BadgeVariants.ExpectedActive]: 'text-white bg-bg-ok',
			[BadgeVariants.UnexpectedActive]: 'text-white bg-bg-error'
		}
	}
});

export type BadgeStylesProps = {
	variant?: VariantProps<typeof badgeVariantStyles>['variant'];
	className?: string;
	isSelected?: boolean;
	overflowWrap?: boolean;
};

const badgeStyles = (props: BadgeStylesProps) => {
	const { variant, isSelected, overflowWrap, className } = props;

	return cn(
		badgeBaseStyles(),
		badgeVariantStyles({ variant }),
		overflowWrap && 'overflow-wrap-anywhere',
		className,
		isSelected && badgeSelectedStyles({ variant })
	);
};

export type BadgeProps<E extends ElementType> = PolymorphicComponentPropWithRef<
	E,
	BadgeStylesProps
>;

export const Badge = forwardRef(
	<E extends ElementType>(
		{
			as,
			variant = BadgeVariants.Primary,
			isSelected,
			onClick,
			className,
			overflowWrap,
			children,
			...props
		}: BadgeProps<E>,
		ref?: PolymorphicRef<E>
	) => {
		const ComponentType = as ? as : onClick ? 'button' : 'div';

		return (
			<ComponentType
				className={badgeStyles({
					variant,
					isSelected,
					className,
					overflowWrap
				})}
				onClick={onClick}
				{...props}
				data-testid="tw-badge"
				ref={ref}
			>
				{children}
			</ComponentType>
		);
	}
);
