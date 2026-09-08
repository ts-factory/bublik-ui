/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { BUBLIK_TAG } from './types';

// `BUBLIK_TAG` is a `const enum`, so it's erased at runtime and `Object.values`
// isn't an option -- every member has to be listed here by hand. A tag missing
// from this array still invalidates, but RTK Query logs a console error for it
// on every use in development.
export const tagTypes: BUBLIK_TAG[] = [
	BUBLIK_TAG.DeployInfo,
	BUBLIK_TAG.DashboardData,
	BUBLIK_TAG.HistoryData,
	BUBLIK_TAG.LogData,
	BUBLIK_TAG.RunCompromiseStatus,
	BUBLIK_TAG.RunExternalRefs,
	BUBLIK_TAG.RunDetails,
	BUBLIK_TAG.User,
	BUBLIK_TAG.Run,
	BUBLIK_TAG.RunComment,
	BUBLIK_TAG.AdminUsersTable,
	BUBLIK_TAG.Config,
	BUBLIK_TAG.importEvents,
	BUBLIK_TAG.SessionList,
	BUBLIK_TAG.Project,
	BUBLIK_TAG.Analytics
];

type TagDescription = BUBLIK_TAG | { type: BUBLIK_TAG; id?: string | number };

/**
 * Marks a query whose response is shaped by server configuration: meta
 * categorization decides which tags are important, `per_conf` drives features
 * and page titles, report configs define report content.
 *
 * The config mutations already invalidate `Config`, so tagging a query with it
 * is what makes a config save refetch that query.
 */
export const configDependent = (
	...tags: TagDescription[]
): TagDescription[] => [BUBLIK_TAG.Config, ...tags];
