/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import {
	ComponentProps,
	ComponentPropsWithoutRef,
	ReactNode,
	forwardRef
} from 'react';

import { cn, Icon } from '@/shared/tailwind-ui';

import { FormSectionHeader, FormSectionHeaderProps } from '../section-header';
import { IconButton } from '../icon-button';

interface FormSectionProps extends ComponentProps<'fieldset'> {
	children: ReactNode;
}

const FormSectionRoot = forwardRef<HTMLFieldSetElement, FormSectionProps>(
	function FormSectionRoot({ children, className, ...props }, ref) {
		return (
			<fieldset
				ref={ref}
				className={cn(
					'relative shrink-0 rounded-2xl border border-border-primary bg-white pl-5 pr-4 pt-5',
					'shadow-[0_1px_2px_rgba(34,60,80,0.06)]',
					'transition-[border-color,box-shadow,transform] hover:border-primary/60 focus-within:border-primary focus-within:shadow-text-field motion-safe:animate-fade-in',
					'md:pr-5 md:pl-7 md:py-3',
					'shadow-sm',
					className
				)}
				{...props}
			>
				{children}
			</fieldset>
		);
	}
);

FormSectionRoot.displayName = 'FormSection';

interface FormSectionHeaderComponentProps extends FormSectionHeaderProps {
	children?: ReactNode;
}

function FormSectionHeaderComponent({
	children,
	...props
}: FormSectionHeaderComponentProps) {
	return <FormSectionHeader {...props}>{children}</FormSectionHeader>;
}

interface FormSectionResetToDefaultButtonProps {
	onClick: () => void;
	helpMessage?: string;
}

function FormSectionResetToDefaultButton({
	onClick,
	helpMessage = 'Reset to defaults'
}: FormSectionResetToDefaultButtonProps) {
	return (
		<IconButton
			name="Refresh"
			size={18}
			helpMessage={helpMessage}
			onClick={onClick}
			className="-scale-x-100"
		/>
	);
}

interface FormSectionResetButtonProps {
	onClick: () => void;
	helpMessage?: string;
}

function FormSectionResetButton({
	onClick,
	helpMessage = 'Clear section'
}: FormSectionResetButtonProps) {
	return (
		<IconButton
			name="Bin"
			size={18}
			helpMessage={helpMessage}
			onClick={onClick}
			className="hover:text-text-unexpected hover:bg-red-100"
		/>
	);
}

function FormSectionBar(props: ComponentPropsWithoutRef<'div'>) {
	const { className, ...rest } = props;
	return (
		<div
			className={cn(
				'absolute w-[14px] -translate-y-px h-[calc(100%+2px)] rounded-l-2xl -translate-x-px left-0 top-0',
				className
			)}
			{...rest}
		/>
	);
}

function FormSectionErrorRoot(props: ComponentPropsWithoutRef<'div'>) {
	const { className, ...rest } = props;

	return (
		<div
			className={cn(
				'bg-bg-fillError rounded-lg py-2 px-4 flex items-center gap-2',
				className
			)}
			{...rest}
		/>
	);
}

function FormSectionErrorTitle(props: ComponentPropsWithoutRef<'div'>) {
	const { className, ...rest } = props;

	return <div className={cn('font-semibold text-sm', className)} {...rest} />;
}

function FormSectionErrorSubtitle(props: ComponentPropsWithoutRef<'div'>) {
	const { className, ...rest } = props;

	return <div className={cn('text-[0.75rem]', className)} {...rest} />;
}

function FormSectionErrorIcon() {
	return (
		<div className="text-text-unexpected shrink-0">
			<Icon name="TriangleExclamationMark" size={22} />
		</div>
	);
}

const FormSectionError = Object.assign(FormSectionErrorRoot, {
	Title: FormSectionErrorTitle,
	Subtitle: FormSectionErrorSubtitle,
	Icon: FormSectionErrorIcon
});

interface FormErrorProps {
	title?: string;
	subtitle: string;
}

function FormError(props: FormErrorProps) {
	const { title, subtitle } = props;

	return (
		<FormSectionErrorRoot>
			<FormSectionErrorIcon />
			{title && <FormSectionErrorTitle>{title}</FormSectionErrorTitle>}
			<FormSectionErrorSubtitle>{subtitle}</FormSectionErrorSubtitle>
		</FormSectionErrorRoot>
	);
}

const FormSection = Object.assign(FormSectionRoot, {
	Header: FormSectionHeaderComponent,
	ResetToDefaultButton: FormSectionResetToDefaultButton,
	ResetButton: FormSectionResetButton,
	Bar: FormSectionBar
});

export { FormSection, FormSectionError, FormError };
export type { FormSectionProps };
