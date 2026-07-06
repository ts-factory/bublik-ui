/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */

export type {
	SidebarNavLinkBaseProps,
	SidebarNavLinkInternalProps,
	SidebarNavLinkExternalProps,
	SidebarNavSubmenuProps,
	SidebarNavToggleProps
} from './lib/sidebar-nav.types';

export {
	wrapperStyles,
	toggleWrapperStyles,
	linkStyles,
	listWrapperStyles,
	accordionLinkStyles,
	paddingTransition
} from './lib/sidebar-nav.styles';

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

export {
	SidebarNavSubmenuItem,
	SidebarNavSubmenuItemContainer
} from './lib/sidebar-nav-submenu-item.component';

export { SidebarAccordionLabel } from './lib/sidebar-nav-accordion.component';

export { useIsActivePaths, type ActivePattern } from './lib/use-is-active';

export {
	getSubmenuIsActive,
	type SubmenuMatchPattern
} from './lib/sidebar-nav.matchers';

export {
	SidebarNavCollapsibleContainer,
	SidebarNavItem,
	type SidebarNavCollapsibleContainerProps
} from './lib/sidebar-nav-collapsible.component';
