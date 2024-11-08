/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024 OKTET LTD */
import { ConfigExistsError, EditConfigBody } from '@/services/bublik-api';
import { useConfirm } from '@/shared/hooks';
import { ButtonTw, ConfirmDialog, Icon, Skeleton } from '@/shared/tailwind-ui';

import { useConfigPageSearchParams, useConfigById } from '../hooks';
import { ConfigEditorForm } from './update-config-form.component';
import { formatJson } from '../components/editor.component';

interface ConfigsEditorContainerProps {
	configId: number;
}

function ConfigsEditorContainer({ configId }: ConfigsEditorContainerProps) {
	const {
		config,
		error,
		isLoading,
		updateConfig,
		versions,
		deleteConfig,
		markAsCurrent,
		isFetching,
		schema
	} = useConfigById(configId);
	const { setConfigId, setNewConfigParams } = useConfigPageSearchParams();
	const { confirm, confirmation, decline, isVisible } = useConfirm();
	const markConfirm = useConfirm();
	const {
		confirmation: confirmationExisting,
		confirm: confirmExisting,
		decline: declineExisting,
		isVisible: isExistingVisible
	} = useConfirm();

	const handleSubmit = async (data: EditConfigBody) => {
		try {
			const result = await updateConfig(data);
			setConfigId(result.id);
		} catch (e) {
			if (e instanceof ConfigExistsError) {
				const shouldNavigate = await confirmationExisting();

				if (!shouldNavigate) return;

				setConfigId(e.configId);
			} else {
				throw e;
			}
		}
	};

	async function handleMarkAsCurrent(id: number) {
		const isConfirmed = await confirmation();
		if (!isConfirmed) return;
		markAsCurrent({ id });
	}

	async function handleDeleteClick(id: number) {
		if (!config) return;
		const isConfirmed = await markConfirm.confirmation();
		if (!isConfirmed) return;
		deleteConfig(id);
		const currentVersion = versions?.all_config_versions
			.filter((v) => v.id !== id)
			.find((v) => v.is_active);

		if (currentVersion) {
			setConfigId(currentVersion.id);
		} else {
			setConfigId(null);
			setNewConfigParams({ name: config.name, type: config.type });
		}
	}

	if (error) return <div>Error...</div>;
	if (isLoading) return <Skeleton className="h-full" />;
	if (!config) return <div>No Data...</div>;

	const defaultValues = {
		content: formatJson(JSON.stringify(config.content, null, 2)),
		description: config.description,
		is_active: config.is_active
	};

	const label = `${config.name} #${config.version}`;

	return (
		<>
			<ConfirmDialog
				open={isVisible}
				title={config.is_active ? 'Deactivate Config?' : 'Activate Config?'}
				description={
					config.is_active
						? 'This configuration will be archived and cannot be used until you activate it again.'
						: 'For the current configuration, this version will be the only active one.'
				}
				onCancelClick={decline}
				onConfirmClick={confirm}
			/>
			<ConfirmDialog
				open={markConfirm.isVisible}
				title="Delete Config?"
				description="This action can not be undone."
				onCancelClick={markConfirm.decline}
				onConfirmClick={markConfirm.confirm}
			/>
			<ConfirmDialog
				open={isExistingVisible}
				title="Config Already Exists"
				description="A config with this content already exists. Do you want to navigate to the existing config?"
				onCancelClick={declineExisting}
				onConfirmClick={confirmExisting}
			/>
			<ConfigEditorForm
				label={label}
				defaultValues={defaultValues}
				schema={schema}
				isLoading={isFetching}
				config={{ id: configId, is_active: config.is_active }}
				versions={versions?.all_config_versions ?? []}
				isModified={false}
				setConfigId={setConfigId}
				handleMarkAsCurrent={handleMarkAsCurrent}
				handleDeleteClick={handleDeleteClick}
				onSubmit={handleSubmit}
			/>
			<div className="mt-4 flex gap-2">
				<ButtonTw
					variant={config.is_active ? 'destruction-secondary' : 'secondary'}
					size="xss"
					onClick={() => handleMarkAsCurrent(configId)}
				>
					<Icon name="Edit" className="size-5 mr-1.5" />
					<span>{config.is_active ? 'Deactivate' : 'Activate'}</span>
				</ButtonTw>
				<ButtonTw
					variant="destruction-secondary"
					size="xss"
					onClick={() => handleDeleteClick(configId)}
				>
					<Icon name="Bin" className="size-5 mr-1.5" />
					<span>Delete</span>
				</ButtonTw>
			</div>
		</>
	);
}

export { ConfigsEditorContainer };
