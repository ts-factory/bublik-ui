/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
const plugin = require('tailwindcss/plugin');

/** @type {import("tailwindcss").Config} */
module.exports = {
	theme: {
		extend: {
			height: { 8.5: '2.125rem' },
			backgroundOpacity: { 15: '0.15' },
			fontFamily: {
				body: 'var(--fonts-body)',
				serif: 'var(--fonts-serif)',
				mono: 'var(--fonts-mono)'
			},
			colors: {
				white: 'hsl(var(--colors-white) / <alpha-value>)',
				primary: 'hsl(var(--colors-primary) / <alpha-value>)',
				'primary-wash': 'hsl(var(--colors-primary-wash) / <alpha-value>)',
				'text-primary': 'hsl(var(--colors-text-primary) / <alpha-value>)',
				'text-secondary': 'hsl(var(--colors-text-secondary) / <alpha-value>)',
				'text-expected': 'hsl(var(--colors-text-expected) / <alpha-value>)',
				'text-unexpected': 'hsl(var(--colors-text-unexpected) / <alpha-value>)',
				'text-menu': 'hsl(var(--colors-text-menu) / <alpha-value>)',
				'bg-primary': 'hsl(var(--colors-bg-primary) / <alpha-value>)',
				'bg-body': 'hsl(var(--colors-bg-body) / <alpha-value>)',
				'bg-fillError': 'hsl(var(--colors-bg-fillError) / <alpha-value>)',
				'bg-fillWarning': 'hsl(var(--colors-bg-fillWarning) / <alpha-value>)',
				'bg-error': 'hsl(var(--colors-bg-error) / <alpha-value>)',
				'bg-warning': 'hsl(var(--colors-bg-warning) / <alpha-value>)',
				'bg-ok': 'hsl(var(--colors-bg-ok) / <alpha-value>)',
				'bg-running': 'hsl(var(--colors-bg-running) / <alpha-value>)',
				'bg-compromised': 'hsl(var(--colors-bg-compromised) / <alpha-value>)',
				'bg-stopped': 'hsl(var(--colors-bg-stopped) / <alpha-value>)',
				'bg-busy': 'hsl(var(--colors-bg-busy) / <alpha-value>)',
				'bg-interrupted': 'hsl(var(--colors-bg-interrupted) / <alpha-value>)',
				'border-primary': 'hsl(var(--colors-border-primary) / <alpha-value>)',
				'badge-0': 'hsl(var(--colors-badge-0) / <alpha-value>)',
				'badge-1': 'hsl(var(--colors-badge-1) / <alpha-value>)',
				'badge-2': 'hsl(var(--colors-badge-2) / <alpha-value>)',
				'badge-3': 'hsl(var(--colors-badge-3) / <alpha-value>)',
				'badge-4': 'hsl(var(--colors-badge-4) / <alpha-value>)',
				'badge-5': 'hsl(var(--colors-badge-5) / <alpha-value>)',
				'badge-6': 'hsl(var(--colors-badge-6) / <alpha-value>)',
				'badge-7': 'hsl(var(--colors-badge-7) / <alpha-value>)',
				'badge-8': 'hsl(var(--colors-badge-8) / <alpha-value>)',
				'badge-9': 'hsl(var(--colors-badge-9) / <alpha-value>)',
				'badge-10': 'hsl(var(--colors-badge-10) / <alpha-value>)',
				'badge-11': 'hsl(var(--colors-badge-11) / <alpha-value>)',
				'badge-12': 'hsl(var(--colors-badge-12) / <alpha-value>)',
				'badge-13': 'hsl(var(--colors-badge-13) / <alpha-value>)',
				'badge-14': 'hsl(var(--colors-badge-14) / <alpha-value>)',
				'badge-15': 'hsl(var(--colors-badge-15) / <alpha-value>)',
				'badge-16': 'hsl(var(--colors-badge-16) / <alpha-value>)',
				'diff-added': 'hsl(var(--diff-added) / <alpha-value>)',
				'diff-removed': 'hsl(var(--diff-removed) / <alpha-value>)',
				'diff-changed': 'hsl(var(--diff-changed) / <alpha-value>)',
				'log-row-error': 'hsl(var(--log-row-error) / <alpha-value>)',
				'log-row-warn': 'hsl(var(--log-row-warn) / <alpha-value>)',
				'log-row-verb': 'hsl(var(--log-row-verb) / <alpha-value>)',
				'log-row-info': 'hsl(var(--log-row-info) / <alpha-value>)',
				'log-row-packet': 'hsl(var(--log-row-packet) / <alpha-value>)'
			},
			boxShadow: {
				popover: 'var(--shadow-popover)',
				tooltip: 'var(--shadow-tooltip)',
				'text-field': 'var(--shadow-text-field)',
				'dialog-sheet': 'var(--shadow-dialog-sheet)',
				'text-field-error': 'var(--shadow-text-field-error)',
				sticky: 'var(--shadow-sticky)'
			},
			keyframes: {
				'fade-in': {
					'0%': { opacity: '0' },
					'100%': { opacity: '1' }
				},
				'fade-out': {
					'0%': { opacity: '1' },
					'100%': { opacity: '0' }
				},
				'dialog-content-show': {
					'0%': { opacity: 0, transform: 'translate(-50%, -50%) scale(0.8)' },
					'100%': { opacity: 1, transform: 'translate(-50%, -50%) scale(1)' }
				},
				'dialog-content-hide': {
					'0%': { opacity: 1, transform: 'translate(-50%, -50%) scale(1)' },
					'100%': { opacity: 0, transform: 'translate(-50%, -50%) scale(0.7)' }
				},
				'slide-in': {
					'0%': { transform: 'translate3d(100%,0,0)' },
					'100%': { transform: 'translate3d(0,0,0)' }
				},
				'slide-out': {
					'0%': { transform: 'translate3d(0,0,0)' },
					'100%': { transform: 'translate3d(100%,0,0)' }
				},
				'drawer-slide-in-right': {
					'0%': { transform: 'translateX(100%)' },
					'100%': { transform: 'translateX(0%)' }
				},
				'drawer-slide-out-right': {
					'0%': { transform: 'translateX(0%)' },
					'100%': { transform: 'translateX(100%)' }
				},
				// Dropdown menu
				'scale-in': {
					'0%': { opacity: 0, transform: 'scale(0)' },
					'100%': { opacity: 1, transform: 'scale(1)' }
				},
				'slide-down': {
					'0%': { opacity: 0, transform: 'translateY(-10px)' },
					'100%': { opacity: 1, transform: 'translateY(0)' }
				},
				'slide-up': {
					'0%': { opacity: 0, transform: 'translateY(10px)' },
					'100%': { opacity: 1, transform: 'translateY(0)' }
				},
				// Tooltip
				'slide-up-fade': {
					'0%': { opacity: 0, transform: 'translateY(2px)' },
					'100%': { opacity: 1, transform: 'translateY(0)' }
				},
				'slide-right-fade': {
					'0%': { opacity: 0, transform: 'translateX(-2px)' },
					'100%': { opacity: 1, transform: 'translateX(0)' }
				},
				'slide-down-fade': {
					'0%': { opacity: 0, transform: 'translateY(-2px)' },
					'100%': { opacity: 1, transform: 'translateY(0)' }
				},
				'slide-left-fade': {
					'0%': { opacity: 0, transform: 'translateX(2px)' },
					'100%': { opacity: 1, transform: 'translateX(0)' }
				},
				// Navigation menu
				'enter-from-right': {
					'0%': { transform: 'translateX(200px)', opacity: 0 },
					'100%': { transform: 'translateX(0)', opacity: 1 }
				},
				'enter-from-left': {
					'0%': { transform: 'translateX(-200px)', opacity: 0 },
					'100%': { transform: 'translateX(0)', opacity: 1 }
				},
				'exit-to-right': {
					'0%': { transform: 'translateX(0)', opacity: 1 },
					'100%': { transform: 'translateX(200px)', opacity: 0 }
				},
				'exit-to-left': {
					'0%': { transform: 'translateX(0)', opacity: 1 },
					'100%': { transform: 'translateX(-200px)', opacity: 0 }
				},
				'scale-in-content': {
					'0%': { transform: 'scale(0.8)', opacity: 0 },
					'100%': { transform: 'scale(1)', opacity: 1 }
				},
				'scale-out-content': {
					'0%': { transform: 'rotateX(0deg) scale(1)', opacity: 1 },
					'100%': { transform: 'rotateX(-10deg) scale(0.95)', opacity: 0 }
				},
				// Toast
				'toast-hide': {
					'0%': { opacity: 1 },
					'100%': { opacity: 0 }
				},
				'toast-slide-in-right': {
					'0%': { transform: `translateX(calc(100% + 1rem))` },
					'100%': { transform: 'translateX(0)' }
				},
				'toast-slide-in-bottom': {
					'0%': { transform: `translateY(calc(100% + 1rem))` },
					'100%': { transform: 'translateY(0)' }
				},
				'toast-swipe-out': {
					'0%': { transform: 'translateX(var(--radix-toast-swipe-end-x))' },
					'100%': {
						transform: `translateX(calc(100% + 1rem))`
					}
				},
				// Collapsible
				'collapsible-slide-down': {
					'0%': { height: 0 },
					'100%': { height: 'var(--radix-collapsible-content-height)' }
				},
				'collapsible-slide-up': {
					'0%': { height: 'var(--radix-collapsible-content-height)' },
					'100%': { height: 0 }
				},
				'highlight-row': {
					'0%': { color: 'initial' },
					'100%': { color: 'hsl(var(--colors-primary))' }
				},
				'auth-blob': {
					'0%': { transform: 'translate(0px, 0px) scale(1)' },
					'33%': { transform: 'translate(30px, -50px) scale(1.1)' },
					'66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
					'100%': { transform: 'translate(0px, 0px) scale(1)' }
				},
				'row-pulse': {
					'0%': { backgroundColor: 'initial', color: 'initial' },
					'100%': {
						color: 'white',
						backgroundColor: 'hsl(var(--colors-primary))'
					}
				}
			},
			animation: {
				'row-pulse': 'row-pulse 0.6s 6 alternate',
				'auth-blob': 'auth-blob 7s infinite',
				fadeIn: 'fadeIn 150ms cubic-bezier(0.16, 1, 0.3, 1)',
				'dialog-content-show':
					'dialog-content-show 300ms cubic-bezier(0.16, 1, 0.3, 1)',
				'dialog-content-hide':
					'dialog-content-hide 300ms cubic-bezier(0.16, 1, 0.3, 1)',
				// Dropdown menu
				'scale-in': 'scale-in 0.2s ease-in-out',
				'slide-down': 'slide-down 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
				'slide-up': 'slide-up 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
				// Tooltip
				'slide-up-fade': 'slide-up-fade 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
				'slide-right-fade':
					'slide-right-fade 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
				'slide-down-fade': 'slide-down-fade 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
				'slide-left-fade': 'slide-left-fade 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
				// Drawer
				'drawer-slide-in-right':
					'drawer-slide-in-right 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
				'drawer-slide-out-right':
					'drawer-slide-out-right 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
				// Navigation menu
				'enter-from-right': 'enter-from-right 0.25s ease',
				'enter-from-left': 'enter-from-left 0.25s ease',
				'exit-to-right': 'exit-to-right 0.25s ease',
				'exit-to-left': 'exit-to-left 0.25s ease',
				'scale-in-content': 'scale-in-content 0.2s ease',
				'scale-out-content': 'scale-out-content 0.2s ease',
				'fade-in': 'fade-in 0.2s ease',
				'fade-out': 'fade-out 0.2s ease',
				// Toast
				'toast-hide': 'toast-hide 100ms ease-in forwards',
				'toast-slide-in-right':
					'toast-slide-in-right 150ms cubic-bezier(0.16, 1, 0.3, 1)',
				'toast-slide-in-bottom':
					'toast-slide-in-bottom 150ms cubic-bezier(0.16, 1, 0.3, 1)',
				'toast-swipe-out': 'toast-swipe-out 100ms ease-out forwards',
				'collapsible-slide-up': 'collapsible-slide-up 300ms ease-out',
				'collapsible-slide-down': 'collapsible-slide-down 300ms ease-out',
				'highlight-row': 'highlight-row 0.6s 6 alternate'
			}
		}
	},
	safelist: [
		'bg-badge-0',
		'bg-badge-1',
		'bg-badge-2',
		'bg-badge-3',
		'bg-badge-4',
		'bg-badge-5',
		'bg-badge-6',
		'bg-badge-7',
		'bg-badge-8',
		'bg-badge-9',
		'bg-badge-10',
		'bg-badge-11',
		'bg-badge-12',
		'bg-badge-13',
		'bg-badge-14',
		'bg-badge-15',
		'bg-badge-16'
	],
	plugins: [
		require('tailwindcss-radix')({ variantPrefix: 'rdx' }),
		require('@tailwindcss/forms'),
		plugin(({ addUtilities, addVariant, addComponents }) => {
			// Utils
			addUtilities({
				'.overflow-wrap-anywhere': { overflowWrap: 'anywhere' },
				'.disable-scrollbar': {
					'&::-webkit-scrollbar': { display: 'none' },
					msOverflowStyle: 'none',
					scrollbarWidth: 'none'
				},
				'.words-break': { wordBreak: 'break-word' }
			});

			// Variants
			addVariant('children-but-last', '& > :not(:last-child)');
			addVariant('children-cross', '& > *:not(:nth-of-type(2n))');
			addVariant('children-cross', '& > *:not(:nth-last-of-type(-n + 2))');
			// Components
			addComponents({
				'.chart-mosaic': {
					display: 'grid',
					gridAutoFlow: 'row',
					gridTemplateColumns: 'repeat(2,minmax(600px,1fr))',
					'& > *:not(:nth-of-type(2n))': { borderRight: '1px solid #dde3eb' },
					'& > *:not(:nth-last-of-type(-n + 2))': {
						borderBottom: '1px solid #dde3eb'
					}
				}
			});
		})
	]
};
