/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import {
	NavLinkProps,
	AccordionLinkProps,
	NavLinkExternal,
	NavLinkInternal
} from './sidebar-nav.types';

export const isExternalLink = (
	props: NavLinkProps | AccordionLinkProps
): props is NavLinkExternal => {
	return 'href' in props;
};

export const isInternalLink = (
	props: NavLinkProps | AccordionLinkProps
): props is NavLinkInternal => {
	return 'to' in props;
};
