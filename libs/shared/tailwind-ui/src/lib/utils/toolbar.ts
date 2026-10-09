/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */

/**
 * The classes of a toolbar button that keeps its icon and drops its label
 * while the toolbar is narrow. The toolbar is a `toolbar-container` or a
 * `toolbar-container-sm` (`apps/bublik/tailwind-bublik-preset.js`), and the
 * `toolbar-narrow` variant matches while it is narrower than its content
 * with every label drawn. Such a button names itself with `aria-label`, as
 * a hidden label is left out of its accessible name, and carries a tooltip.
 *
 * Collapsed, the button is a square as tall as it was, with the icon
 * centered: `aspect-square` sets the width from the height, so a host that
 * draws its buttons taller gets a larger square, not an oblong.
 */
export const TOOLBAR_BUTTON_CLASS =
	'toolbar-narrow:h-[26px] toolbar-narrow:aspect-square toolbar-narrow:p-0';
export const TOOLBAR_ICON_CLASS = 'mr-1.5 toolbar-narrow:mr-0';
export const TOOLBAR_LABEL_CLASS = 'toolbar-narrow:hidden';
