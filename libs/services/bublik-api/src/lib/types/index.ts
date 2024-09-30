/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
/** Bublik API tags used for data caching and invalidation */
export const enum BUBLIK_TAG {
	DeployInfo = 'DeployInfo',
	DashboardData = 'DashboardData',
	HistoryData = 'HistoryData',
	LogData = 'LogData',
	RunCompromiseStatus = 'RunCompromiseStatus',
	RunExternalRefs = 'RunExternalRefs',
	RunDetails = 'RunDetails',
	User = 'user',
	Run = 'run',
	AdminUsersTable = 'admin-users-table',
	Config = 'config'
}
