/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import {
	ChangelogContent,
	DeployInfoContainer
} from '@/bublik/features/deploy-info';

export const ChangelogPage = () => {
	return (
		<div className="flex justify-center p-2">
			<div className="p-6 bg-white w-[812px] rounded-lg">
				<div className="mb-4">
					<DeployInfoContainer />
				</div>
				<ChangelogContent />
			</div>
		</div>
	);
};
