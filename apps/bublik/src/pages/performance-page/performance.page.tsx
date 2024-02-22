/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024 OKTET LTD */

import { PerformanceListContainer } from '@/bublik/features/performance-check';

export const PerformancePage = () => {
	return (
		<div className="h-screen p-2">
			<div className="h-full flex justify-center items-center">
				<div className="max-w-4xl flex-1 bg-white rounded-lg p-4">
					<PerformanceListContainer />
				</div>
			</div>
		</div>
	);
};
