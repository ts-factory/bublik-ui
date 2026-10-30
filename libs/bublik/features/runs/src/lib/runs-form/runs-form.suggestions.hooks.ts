/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { useCallback, useMemo, useState } from 'react';
import { skipToken } from '@reduxjs/toolkit/query';

import { useGetMetasSearchOptionsQuery } from '@/services/bublik-api';
import { useProjectSearch } from '@/bublik/features/projects';
import type { BoxValue, MetaFilterSuggestionGroup } from '@/shared/tailwind-ui';

import { RUN_DATA_GROUP_ORDER } from '../runs-slice.selectors';
import { normalizeRunDataValue } from '../runs-key-value';

const [IMPORTANT_GROUP, META_GROUP, TAGS_GROUP] = RUN_DATA_GROUP_ORDER;

const IMPORTANT_CLASS = 'bg-badge-6';
const META_CLASS = 'bg-badge-4';
const TAGS_CLASS = 'bg-badge-0';

/**
 * The groups the field offers, in order: the table's Important and Tags
 * groups, the metadata by kind as the history form names them, and the
 * metadata of the loaded runs the project list does not hold, whose kind
 * is unknown.
 */
const GROUPS = [
	{ label: IMPORTANT_GROUP, kind: 'tag', className: IMPORTANT_CLASS },
	{ label: 'Labels', kind: 'label', className: META_CLASS },
	{ label: 'Branches', kind: 'branch', className: META_CLASS },
	{ label: 'Revisions', kind: 'revision', className: META_CLASS },
	{ label: TAGS_GROUP, kind: 'tag', className: TAGS_CLASS },
	{ label: META_GROUP, valueOnly: true, className: META_CLASS }
] as const;

type GroupLabel = (typeof GROUPS)[number]['label'];

interface RunsMetaSuggestions {
	groups: readonly MetaFilterSuggestionGroup[];
	isLoading: boolean;
	/** Starts the project-wide fetch: called when the field first gets focus. */
	request: () => void;
}

/**
 * What the metas field offers: the project's metas, fetched once the field
 * has had focus, merged with the metas of the runs already on the page, so
 * the list is never empty while the project list loads.
 *
 * The run data match metas of every type, but each expression parameter
 * searches one type, so the groups carry their kind: an expression chip
 * takes the kind of the metas it names and the form sends it under that
 * kind's parameter. The loaded runs' metadata is a flat list, so what the
 * project list does not hold yet is offered as value chips only, instead
 * of being sent under the wrong parameter.
 */
function useRunsMetaSuggestions(loadedTags: BoxValue[]): RunsMetaSuggestions {
	const { projectIds } = useProjectSearch();
	const [isRequested, setIsRequested] = useState(false);

	const { currentData, isFetching } = useGetMetasSearchOptionsQuery(
		isRequested ? { project: projectIds[0] } : skipToken
	);

	const request = useCallback(() => setIsRequested(true), []);

	const groups = useMemo<MetaFilterSuggestionGroup[]>(() => {
		const byGroup = new Map<GroupLabel, Set<string>>(
			GROUPS.map((group) => [group.label, new Set<string>()])
		);
		const add = (group: GroupLabel, values: readonly string[]) => {
			const items = byGroup.get(group);
			values.forEach((value) => items?.add(normalizeRunDataValue(value)));
		};

		add(IMPORTANT_GROUP, currentData?.tags.important ?? []);
		add('Labels', currentData?.labels ?? []);
		add('Branches', currentData?.branches ?? []);
		add('Revisions', currentData?.revisions ?? []);
		add(TAGS_GROUP, currentData?.tags.relevant ?? []);

		// The loaded runs' tags join their groups; their metadata only what no
		// kind-bearing group holds already.
		const known = new Set(
			Array.from(byGroup.values()).flatMap((items) => Array.from(items))
		);
		for (const tag of loadedTags) {
			const value = normalizeRunDataValue(tag.value);
			if (tag.groupLabel === IMPORTANT_GROUP || tag.groupLabel === TAGS_GROUP) {
				add(tag.groupLabel, [value]);
			} else if (!known.has(value)) {
				add(META_GROUP, [value]);
			}
		}

		return GROUPS.map((group) => ({
			...group,
			items: Array.from(byGroup.get(group.label) ?? [])
		})).filter((group) => group.items.length > 0);
	}, [currentData, loadedTags]);

	return { groups, isLoading: isRequested && isFetching, request };
}

export { useRunsMetaSuggestions };
export type { RunsMetaSuggestions };
