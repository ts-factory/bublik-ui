/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024 OKTET LTD */
import { useConfigPageSearchParams } from './hooks';
import { ConfigsEditorContainer } from './update-config-form/update-config-form.container';
import { ConfigsSidebarContainer } from './sidebar/config-sidebar.container';
import { CreateNewConfigScreen } from './create-config-form/create-new-config.container';

import { CreateProjectButton } from '@/bublik/features/projects';

function ConfigsPage() {
	const { configId, newConfigParams } = useConfigPageSearchParams();

	return (
		<div className="p-2 h-full flex gap-1">
			<div className="bg-white rounded-md h-full w-[320px] overflow-hidden">
				<ConfigsSidebarContainer
					createProjectButton={
						<CreateProjectButton variant="secondary" size="xss" />
					}
				/>
			</div>
			<div className="bg-white rounded-md h-full overflow-hidden flex-1">
				{configId ? (
					<ConfigsEditorContainer key={configId} configId={configId} />
				) : (
					<CreateNewConfigScreen key={JSON.stringify(newConfigParams)} />
				)}
			</div>
		</div>
	);
}

export { ConfigsPage };
