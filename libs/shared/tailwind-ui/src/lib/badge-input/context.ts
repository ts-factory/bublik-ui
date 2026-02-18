/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { createContext, useContext } from 'react';

import { BadgeItem } from './types';

export interface BadgeInputContext {
	onDeleteClick: (badgeIdToDelete: string) => void;
	onBadgeEdit: (badgeToEdit: BadgeItem) => void;
}

export const BadgeInputContext = createContext<BadgeInputContext | null>(null);

export const useBadgeInputContext = () => {
	const context = useContext(BadgeInputContext);

	if (!context) {
		throw new Error(
			'Must use useBadgeInputHook inside BadgeInputContext provider'
		);
	}

	return context;
};
