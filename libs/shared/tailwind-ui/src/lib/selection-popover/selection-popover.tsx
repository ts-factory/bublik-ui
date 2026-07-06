/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import {
	Children,
	ComponentPropsWithoutRef,
	ReactNode,
	createContext,
	useCallback,
	useContext,
	isValidElement,
	useMemo,
	useState
} from 'react';
import { AnimatePresence, motion, Transition, Variants } from 'framer-motion';

import { ButtonTw, ButtonTwProps } from '../button';
import { Icon, IconProps } from '../icon';
import { cn } from '../utils';

const variants: Variants = {
	visible: { opacity: 1, y: '0%' },
	hidden: { opacity: 0, y: '100%' },
	exit: { opacity: 0, y: '100%' }
};

const transition: Transition = { bounce: 0.1 };

interface SelectionPopoverContextValue {
	isOpen: boolean;
	setOpen: (open: boolean) => void;
}

const SelectionPopoverContext = createContext<
	SelectionPopoverContextValue | undefined
>(undefined);

interface SelectionPopoverProps {
	children: ReactNode;
	open?: boolean;
	defaultOpen?: boolean;
	onOpenChange?: (open: boolean) => void;
	className?: string;
	layout?: ComponentPropsWithoutRef<typeof motion.div>['layout'];
}

function SelectionPopover(props: SelectionPopoverProps) {
	const { children, open, defaultOpen, onOpenChange, className, layout } =
		props;
	const [uncontrolledOpen, setUncontrolledOpen] = useState(
		defaultOpen ?? false
	);
	const isControlled = open !== undefined;
	const isOpen = isControlled ? open : uncontrolledOpen;

	const setOpen = useCallback(
		(nextOpen: boolean) => {
			if (!isControlled) setUncontrolledOpen(nextOpen);
			onOpenChange?.(nextOpen);
		},
		[isControlled, onOpenChange]
	);

	const childrenArray = Children.toArray(children);
	const floatingButtons = childrenArray.filter(
		(child) =>
			isValidElement(child) && child.type === SelectionPopoverFloatingButton
	);
	const contentChildren = childrenArray.filter(
		(child) =>
			!(isValidElement(child) && child.type === SelectionPopoverFloatingButton)
	);
	const hasFloatingButton = floatingButtons.length > 0;

	const value = useMemo(() => ({ isOpen, setOpen }), [isOpen, setOpen]);

	const bottomOffsetClassName = hasFloatingButton ? 'bottom-16' : 'bottom-4';

	return (
		<SelectionPopoverContext.Provider value={value}>
			{floatingButtons}
			<AnimatePresence>
				{isOpen ? (
					<motion.div
						variants={variants}
						initial="hidden"
						animate="visible"
						exit="exit"
						transition={transition}
						layout={layout}
						className={cn(
							'fixed right-4 bg-white rounded-lg shadow-popover min-w-[360px] max-h-[90vh] flex flex-col z-50',
							bottomOffsetClassName,
							className
						)}
					>
						{contentChildren}
					</motion.div>
				) : null}
			</AnimatePresence>
		</SelectionPopoverContext.Provider>
	);
}

type SelectionPopoverSectionProps = ComponentPropsWithoutRef<'div'>;

function SelectionPopoverBody({
	className,
	...props
}: SelectionPopoverSectionProps) {
	return (
		<div
			className={cn(
				'flex flex-col gap-2 px-4 pt-2 flex-1 overflow-auto',
				className
			)}
			{...props}
		/>
	);
}

function SelectionPopoverFooter({
	className,
	...props
}: SelectionPopoverSectionProps) {
	return (
		<div
			className={cn(
				'flex flex-col gap-2 px-4 py-2 mt-2 border-t border-border-primary',
				className
			)}
			{...props}
		/>
	);
}

type SelectionPopoverTitleProps = ComponentPropsWithoutRef<'h1'>;

function SelectionPopoverTitle({
	className,
	...props
}: SelectionPopoverTitleProps) {
	return (
		<h1
			className={cn(
				'text-[0.875rem] leading-[1.125rem] font-semibold mb-2',
				className
			)}
			{...props}
		/>
	);
}

type SelectionPopoverListProps = ComponentPropsWithoutRef<'ul'>;

function SelectionPopoverList({
	className,
	...props
}: SelectionPopoverListProps) {
	return (
		<ul className={cn('flex flex-col gap-2 mb-4', className)} {...props} />
	);
}

type SelectionPopoverFloatingButtonProps = Omit<ButtonTwProps, 'children'> & {
	children?: ReactNode;
	icon?: IconProps['name'];
	label?: string;
};

function SelectionPopoverFloatingButton(
	props: SelectionPopoverFloatingButtonProps
) {
	const {
		className,
		disabled,
		icon = 'ExpandSelection',
		label = 'Selection',
		children,
		onClick,
		variant = 'primary',
		size = 'sm',
		rounded = 'full',
		...rest
	} = props;
	const { isOpen, setOpen } = useSelectionPopoverContext();

	return (
		<ButtonTw
			variant={variant}
			size={size}
			rounded={rounded}
			className={cn('fixed bottom-4 right-4 z-40 gap-2 shadow-xl', className)}
			aria-expanded={isOpen}
			data-state={isOpen ? 'open' : 'closed'}
			disabled={disabled}
			onClick={(event) => {
				onClick?.(event);
				if (event.defaultPrevented || disabled) return;
				setOpen(!isOpen);
			}}
			type="button"
			{...rest}
		>
			{children ?? (
				<>
					<Icon name={icon} size={16} />
					<span>{label}</span>
					{isOpen ? (
						<Icon name="ChevronDown" size={16} className="" />
					) : (
						<Icon name="ChevronDown" size={16} className="rotate-180" />
					)}
				</>
			)}
		</ButtonTw>
	);
}

function useSelectionPopoverContext() {
	const context = useContext(SelectionPopoverContext);
	if (!context) {
		throw new Error(
			'useSelectionPopoverContext must be used within SelectionPopover'
		);
	}
	return context;
}

export {
	SelectionPopover,
	SelectionPopoverBody,
	SelectionPopoverFooter,
	SelectionPopoverTitle,
	SelectionPopoverList,
	SelectionPopoverFloatingButton,
	useSelectionPopoverContext
};
