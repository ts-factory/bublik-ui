import { cva } from '@/shared/tailwind-ui';

export const comboboxInputStyles = cva({
	base: [
		'w-full',
		'px-3.5',
		'py-[7px]',
		'outline-none',
		'border',
		'border-border-input',
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

/**
 * A field of a rule in the classify form: its name, its values, its buttons,
 * in one row, so a rule reads as a few lines and several fit a screen.
 */
export const SCOPE_ROW_CLASS =
	'grid grid-cols-[5.5rem_minmax(0,1fr)_auto] items-start gap-x-2';

export const SCOPE_ROW_LABEL_CLASS =
	'pt-[5px] text-[0.6875rem] uppercase leading-4 tracking-wider text-text-menu';

/** The muted line a row reads when the rule does not match on its field. */
export const SCOPE_ROW_EMPTY_CLASS = 'text-xs italic text-text-menu';
