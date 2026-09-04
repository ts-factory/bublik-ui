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
	UnexpectedActive = 'unexpected-active',
	/** "Needs a human" — violet, so triage never blends into a failure. */
	Triage = 'triage',
	/** Known-bad, but not the product's fault — orange. */
	Warning = 'warning',
	/** Unreliable rather than broken — yellow. */
	Caution = 'caution',
	/** Already triaged, nothing to decide — blue. */
	Info = 'info',
	/** The environment, not the thing under test — cyan. */
	Env = 'env',
	/** Nothing to assert — grey. */
	Neutral = 'neutral',
	/**
	 * Explicitly *no* claim. The only hollow chip in the system: the coloured
	 * families all assert something, and grey is spoken for as the identity hue.
	 */
	Outline = 'outline'
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
			[BadgeVariants.UnexpectedActive]: 'bg-bg-fillError',
			[BadgeVariants.Triage]: 'text-text-triage bg-badge-2',
			// The four hues below keep `text-text-primary` rather than inking with
			// their own accent: `bg-warning` and `bg-busy` are fill-grade tokens and
			// fail contrast as text on their own pale wash. The border carries the
			// hue match instead, which is what the selected state needs anyway.
			[BadgeVariants.Warning]: 'bg-badge-14 text-text-primary',
			[BadgeVariants.Caution]: 'bg-badge-17 text-text-primary',
			[BadgeVariants.Info]: 'bg-badge-1 text-text-primary',
			[BadgeVariants.Env]: 'bg-badge-7 text-text-primary',
			[BadgeVariants.Neutral]: 'bg-badge-0 text-text-menu',
			[BadgeVariants.Outline]:
				'bg-transparent border-border-primary text-text-primary'
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
			[BadgeVariants.UnexpectedActive]: 'text-white bg-bg-error',
			[BadgeVariants.Triage]: 'border-text-triage',
			[BadgeVariants.Warning]: 'border-bg-warning',
			[BadgeVariants.Caution]: 'border-bg-busy',
			[BadgeVariants.Info]: 'border-primary',
			[BadgeVariants.Env]: 'border-accent-env',
			[BadgeVariants.Neutral]: 'border-text-menu',
			[BadgeVariants.Outline]: 'border-text-primary'
		}
	}
});

/**
 * What a badge looks like under the pointer, once it is a control.
 *
 * The same colour as the selected outline, at a fraction of its strength: hover
 * is a preview of what clicking will do, so it has to be the *chip's own* hue
 * rather than a single house blue. `Primary` and `Transparent` are the two
 * variants whose selected state swaps the fill instead of the border, so they
 * preview with the blue they are about to become.
 *
 * The badge base already carries `border border-transparent`, so colouring the
 * border on hover costs no layout shift.
 */
export const badgeHoverStyles = cva({
	variants: {
		variant: {
			[BadgeVariants.Transparent]: 'hover:border-primary/50',
			[BadgeVariants.Primary]: 'hover:border-primary/50',
			[BadgeVariants.PrimaryActive]: 'hover:border-primary/50',
			[BadgeVariants.Expected]: 'hover:border-text-expected/40',
			[BadgeVariants.ExpectedActive]: 'hover:border-text-expected/40',
			[BadgeVariants.Unexpected]: 'hover:border-text-unexpected/40',
			[BadgeVariants.UnexpectedActive]: 'hover:border-text-unexpected/40',
			[BadgeVariants.Triage]: 'hover:border-text-triage/40',
			[BadgeVariants.Warning]: 'hover:border-bg-warning/40',
			[BadgeVariants.Caution]: 'hover:border-bg-busy/40',
			[BadgeVariants.Info]: 'hover:border-primary/40',
			[BadgeVariants.Env]: 'hover:border-accent-env/40',
			[BadgeVariants.Neutral]: 'hover:border-text-menu/40',
			[BadgeVariants.Outline]: 'hover:border-text-primary/40'
		}
	}
});

export type BadgeStylesProps = {
	variant?: VariantProps<typeof badgeVariantStyles>['variant'];
	className?: string;
	isSelected?: boolean;
	overflowWrap?: boolean;
	/**
	 * The badge is a control. Inferred from `onClick`, which is how the badge
	 * already decides between `button` and `div`; pass it explicitly when the
	 * interactivity comes from somewhere else -- `as={Link}`, `as="a"`.
	 */
	isInteractive?: boolean;
};

const badgeStyles = (props: BadgeStylesProps) => {
	const { variant, isSelected, isInteractive, overflowWrap, className } = props;

	return cn(
		badgeBaseStyles(),
		badgeVariantStyles({ variant }),
		// Not while selected: `hover:border-X` and `border-X` are different
		// variants, so twMerge keeps both, and the chip would swap between the
		// faint preview and the real outline every time the pointer crossed it.
		isInteractive &&
			!isSelected &&
			cn('cursor-pointer', badgeHoverStyles({ variant })),
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
			isInteractive,
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
					isInteractive: isInteractive ?? Boolean(onClick),
					className,
					overflowWrap
				})}
				onClick={onClick}
				data-testid="tw-badge"
				{...props}
				ref={ref}
			>
				{children}
			</ComponentType>
		);
	}
);
