/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { z } from 'zod';

import { useUserPreferences } from '@/bublik/features/user-preferences';
import { useLocalStorage } from '@/shared/hooks';

const ALL_PAGES_MEMORY_KEY = 'log-all-pages-memory';
const ALL_PAGES_MEMORY_TTL = 24 * 60 * 60 * 1000;
const EMPTY_ALL_PAGES_MEMORY: AllPagesMemory = {};
const AllPagesMemorySchema = z.record(z.string(), z.number()).catch({});

interface AllPagesIdentity {
	projectId: number;
	runId: string | number;
	path: string;
}

type AllPagesMemory = Record<string, number>;

function getAllPagesMemoryKey(identity: AllPagesIdentity): string {
	return JSON.stringify([
		identity.projectId,
		identity.runId.toString(),
		identity.path
	]);
}

function isAllPagesRemembered(
	memory: AllPagesMemory,
	identity: AllPagesIdentity,
	now = Date.now()
): boolean {
	return (memory[getAllPagesMemoryKey(identity)] ?? 0) > now;
}

function updateAllPagesMemory(
	memory: AllPagesMemory,
	identity: AllPagesIdentity,
	remember: boolean,
	now = Date.now()
): AllPagesMemory {
	const nextMemory = Object.fromEntries(
		Object.entries(memory).filter(([, expiresAt]) => expiresAt > now)
	);
	const key = getAllPagesMemoryKey(identity);

	if (remember) {
		nextMemory[key] = now + ALL_PAGES_MEMORY_TTL;
	} else {
		delete nextMemory[key];
	}

	return nextMemory;
}

function useAllPagesMemory() {
	const { userPreferences } = useUserPreferences();
	const [storedMemory, setStoredMemory] = useLocalStorage<AllPagesMemory>(
		ALL_PAGES_MEMORY_KEY,
		EMPTY_ALL_PAGES_MEMORY
	);
	const memory = AllPagesMemorySchema.parse(storedMemory);
	const isEnabled = userPreferences.log.rememberAllPages;

	const isRemembered = (identity: AllPagesIdentity): boolean => {
		return isEnabled && isAllPagesRemembered(memory, identity);
	};

	const remember = (identity: AllPagesIdentity): void => {
		if (!isEnabled) return;

		setStoredMemory((currentMemory) =>
			updateAllPagesMemory(
				AllPagesMemorySchema.parse(currentMemory),
				identity,
				true
			)
		);
	};

	const forget = (identity: AllPagesIdentity): void => {
		setStoredMemory((currentMemory) =>
			updateAllPagesMemory(
				AllPagesMemorySchema.parse(currentMemory),
				identity,
				false
			)
		);
	};

	return { isRemembered, remember, forget } as const;
}

export {
	ALL_PAGES_MEMORY_TTL,
	getAllPagesMemoryKey,
	isAllPagesRemembered,
	updateAllPagesMemory,
	useAllPagesMemory
};
export type { AllPagesIdentity, AllPagesMemory };
