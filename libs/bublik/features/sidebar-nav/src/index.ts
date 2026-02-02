/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */

// ============================
// Types
// ============================
export type {
	SearchPattern,
	MatchPattern,
	NavLinkCommon,
	NavLinkInternal,
	NavLinkExternal,
	NavLinkProps,
	AccordionLinkProps,
	SidebarItem,
	SidebarNavLinkBaseProps,
	SidebarNavLinkInternalProps,
	SidebarNavLinkExternalProps,
	SidebarAccordionLinkProps,
	SidebarNavSubmenuProps,
	SidebarNavToggleProps
} from './lib/sidebar-nav.types';

// ============================
// Utilities
// ============================
export { isExternalLink, isInternalLink } from './lib/sidebar-nav.utils';

// ============================
// Styles
// ============================
export {
	wrapperStyles,
	toggleWrapperStyles,
	linkStyles,
	listWrapperStyles,
	accordionLinkStyles,
	paddingTransition
} from './lib/sidebar-nav.styles';

// ============================
// Hooks
// ============================
export {
	useNavLink,
	useAccordionLink,
	useMatchPathPattern,
	useMatchSearchPattern,
	matchMultiple
} from './lib/nav-link.hooks';
export type {
	UseAccordionLinkConfig,
	UseNavLinkConfig,
	HooksMatchPattern,
	SearchPattern as HooksSearchPattern
} from './lib/nav-link.hooks';

// ============================
// Presentational Components (Primitives)
// ============================
export {
	SidebarNavInternalLink,
	SidebarNavExternalLink,
	SidebarNavInfoButton,
	SidebarNavLinkWrapper
} from './lib/sidebar-nav-link.component';

export { SidebarAccordionLink } from './lib/sidebar-nav-accordion.component';

export {
	SidebarNavToggle,
	SidebarNavSubmenuContainer,
	SidebarNavItemContainer,
	SidebarNavListWrapper
} from './lib/sidebar-nav-submenu.component';

// ============================
// Connected Components (Containers)
// ============================
export { NavLink } from './lib/nav-link.container';

export {
	SidebarNavCollapsibleContainer,
	type SidebarNavCollapsibleContainerProps
} from './lib/sidebar-nav-collapsible.component';
