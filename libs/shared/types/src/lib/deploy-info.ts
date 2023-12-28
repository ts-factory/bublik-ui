/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
/**
|--------------------------------------------------
| INTERFACES
|--------------------------------------------------
*/

export interface DeployCommitInfo {
	commitDate: string;
	commitRev: string;
	commitSummary: string;
}

export interface DeployGitInfo {
	repoUrl?: string;
	repoBranch?: string;
	latestCommit?: DeployCommitInfo;
	repoTag?: string;
}

export type DeployGitInfoAPIResponse = DeployGitInfo;

export type DeployProjectAPIResponse = {
	project: string;
};

export type DeployInfo = {
	projectName: string;
	backendGitInfo: DeployGitInfo;
};
