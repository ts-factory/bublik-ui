import { cva } from '@/shared/tailwind-ui';

export const comboboxInputStyles = cva({
	base: [
		'w-full',
		'px-3.5',
		'py-[7px]',
		'outline-none',
		'border',
		'border-border-primary',
		'rounded',
		'text-text-secondary',
		'transition-all',
		'disabled:text-text-menu',
		'disabled:cursor-not-allowed',
		'disabled:bg-bg-body',
		'focus:border-primary',
		'focus:shadow-text-field',
		'active:shadow-none',
		'focus:ring-transparent',
		'placeholder:text-text-menu placeholder:font-normal',
		'leading-[1.5rem] font-medium text-[0.875rem]'
	]
});
