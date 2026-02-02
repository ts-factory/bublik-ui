/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import type { To } from 'react-router-dom';
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

export function toString(to: To): string {
	if (typeof to === 'string') return to;
	return `${to.pathname}${to.search ? `?${to.search}` : ''}${
		to.hash ? `#${to.hash}` : ''
	}`;
}
