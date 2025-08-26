/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024 OKTET LTD */
import { ComponentProps, useRef, useState } from 'react';
import { UseFormReturn } from 'react-hook-form';

import {
	ConfigExistsError,
	ConfigWithSameNameErrorResponseSchema,
	EditConfigBody,
	getErrorMessage
} from '@/services/bublik-api';
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
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const {
		confirmation: confirmationExisting,
		confirm: confirmExisting,
		decline: declineExisting,
		isVisible: isExistingVisible
	} = useConfirm();
	const formRef =
		useRef<
			UseFormReturn<ComponentProps<typeof ConfigEditorForm>['defaultValues']>
		>(null);

	const handleSubmit = async (data: EditConfigBody) => {
		const form = formRef.current;

		try {
			const result = await updateConfig(data);
			setConfigId(result.id);
			setIsDialogOpen(false);
		} catch (e) {
			const parseResult = ConfigWithSameNameErrorResponseSchema.safeParse(e);

			if (parseResult.success) {
				form?.setError('root', { message: parseResult.data.data.message });
				return;
			}

			if (e instanceof ConfigExistsError) {
				const shouldNavigate = await confirmationExisting();

				if (!shouldNavigate) return;

				setConfigId(e.configId);
			}
		}
	};

	async function handleMarkAsCurrent() {
		const isConfirmed = await confirmation();
		if (!isConfirmed || !config) return;
		markAsCurrent({ is_active: !config.is_active });
	}

	async function handleDeleteClick(id: number) {
		if (!config) return;
		const isConfirmed = await markConfirm.confirmation();
		if (!isConfirmed) return;
		await deleteConfig(id);
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

	if (error) return <ConfigEditorError error={error} />;
	if (isLoading) return <Skeleton className="h-full" />;
	if (!config) return <div>No Data...</div>;

	const defaultValues = {
		name: config.name,
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
				setConfigId={setConfigId}
				handleMarkAsCurrent={handleMarkAsCurrent}
				handleDeleteClick={handleDeleteClick}
				onSubmit={handleSubmit}
				isOpen={isDialogOpen}
				setIsOpen={setIsDialogOpen}
				ref={formRef}
			/>
			<div className="mt-4 flex gap-2">
				<ButtonTw
					variant={config.is_active ? 'destruction-secondary' : 'secondary'}
					size="xss"
					onClick={() => handleMarkAsCurrent()}
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

interface ConfigEditorErrorProps {
	error: unknown;
}

function ConfigEditorError(props: ConfigEditorErrorProps) {
	const { error } = props;

	const { description } = getErrorMessage(error);

	return <div className="grid place-items-center h-full">{description}</div>;
}

export { ConfigsEditorContainer };
