/* SPDX-License-Identifier: Apache-2.0 */
import { IssuesTable } from '@/bublik/features/result-classification';

export const AdminIssuesPage = () => {
	return (
		<div className="flex flex-col p-2">
			<header className="px-6 py-4 bg-white rounded-t-xl">
				<h1 className="text-xl font-semibold">Issues</h1>
			</header>
			<main className="p-4 bg-white rounded-b-xl">
				<IssuesTable />
			</main>
		</div>
	);
};
