/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024 OKTET LTD */
import { useState, useRef } from 'react';
import { Monaco } from '@monaco-editor/react';
import { toast } from 'sonner';

import { bublikAPI } from '@/services/bublik-api';
import {
	Input,
	cn,
	Dialog,
	DialogContent,
	dialogContentStyles,
	DialogOverlay,
	dialogOverlayStyles,
	Skeleton,
	Checkbox,
	ButtonTw,
	Tooltip,
	Icon
} from '@/shared/tailwind-ui';

import { useConfigPageSearchParams, useSavedState } from '../hooks';
import { getEditorValue, isValidJson, ValidationErrorSchema } from '../utils';
import { ConfigEditor } from '../components/editor.component';

function CreateNewConfigScreen() {
	const { newConfigParams, setConfigId } = useConfigPageSearchParams();
	const [createConfigMutation, { isLoading }] =
		bublikAPI.useCreateConfigMutation();
	const editorRef = useRef<Monaco>();
	const { savedValue, setSavedValue } = useSavedState(
		JSON.stringify(newConfigParams),
		editorRef
	);
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
	const [configName, setConfigName] = useState('');
	const [configDescription, setConfigDescription] = useState('');
	const [isActive, setIsActive] = useState(false);

	function handleCreateConfigClick() {
		const value = getEditorValue(editorRef.current);

		if (!isValidJson(value)) return toast.error('Failed to parse JSON');
		if (!newConfigParams) return toast.error('No config type provided');

		setIsCreateDialogOpen(true);
	}

	async function handleCreateSubmit(e: React.FormEvent) {
		e.preventDefault();
		setIsCreateDialogOpen(false);
		const value = getEditorValue(editorRef.current);

		if (!newConfigParams) return toast.error('No config params present');

		const promise = createConfigMutation({
			type: newConfigParams.type,
			name: configName,
			description: configDescription,
			is_active: isActive,
			content: JSON.parse(value)
		}).unwrap();

		toast.promise(promise, {
			success: 'Successfully created config',
			error: (e) => {
				try {
					const {
						data: { message }
					} = ValidationErrorSchema.parse(e);
					const errorMessage = Object.values(message).flat().join('\n');

					return errorMessage;
				} catch (parseError) {
					console.error(parseError);
				}
				return 'Failed to create config';
			},
			loading: 'Creating config...'
		});

		const result = await promise;
		setConfigId(result.id);
		setConfigName('');
		setConfigDescription('');
		setSavedValue('');
	}

	if (!newConfigParams) {
		return (
			<div className="flex flex-col items-center justify-center flex-1 p-4 text-center h-full">
				<Icon name="SettingsSliders" className="size-12 mb-4 text-text-menu" />
				<h3 className="text-lg font-semibold mb-2">
					No configurations selected
				</h3>
				<p className="text-sm text-text-menu mb-4">
					Select or create your configuration to get started.
				</p>
			</div>
		);
	}

	const label = `Create New ${
		newConfigParams.type === 'global' ? 'Global' : 'Report'
	} Config`;

	const schemaQuery = bublikAPI.useGetConfigSchemaQuery(newConfigParams);

	if (schemaQuery.isLoading) {
		return <Skeleton className="flex-1" />;
	}

	return (
		<>
			<Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
				<DialogOverlay className={dialogOverlayStyles()} />
				<DialogContent
					className={cn(
						dialogContentStyles(),
						'sm:max-w-md p-6 bg-white sm:rounded-lg md:shadow min-w-[420px] overflow-auto max-h-[85vh]'
					)}
				>
					<form onSubmit={handleCreateSubmit}>
						<h2 className="mb-4 text-xl font-semibold leading-tight text-text-primary">
							New Config
						</h2>
						<div className="mb-4">
							<label
								htmlFor="configName"
								className="block text-sm font-medium text-gray-700"
							>
								Name
							</label>
							<Input
								placeholder="per_conf"
								type="text"
								id="configName"
								value={configName}
								onChange={(e) => setConfigName(e.target.value)}
								required
							/>
						</div>
						<div className="mb-4">
							<label
								htmlFor="configDescription"
								className="block text-sm font-medium text-gray-700"
							>
								Description
							</label>
							<textarea
								id="configDescription"
								value={configDescription}
								onChange={(e) => setConfigDescription(e.target.value)}
								rows={4}
								className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
								required
								placeholder="Enter description for the new config"
							/>
						</div>
						<div className="mb-4">
							<label className="flex items-center">
								<Checkbox
									checked={isActive}
									onCheckedChange={(checked) => setIsActive(checked === true)}
								/>
								<span className="ml-2 text-sm text-gray-700">
									Activate config?
								</span>
							</label>
						</div>
						<div className="flex justify-end gap-2">
							<ButtonTw
								variant="secondary"
								type="button"
								onClick={() => setIsCreateDialogOpen(false)}
							>
								Cancel
							</ButtonTw>
							<ButtonTw type="submit" variant="primary">
								Create
							</ButtonTw>
						</div>
					</form>
				</DialogContent>
			</Dialog>
			<ConfigEditor
				schema={schemaQuery.data}
				defaultValue={savedValue ?? '{\n \n}'}
				ref={editorRef}
				className={cn(isLoading && 'pointer-events-none opacity-40')}
				onChange={(v) => setSavedValue(v ?? '')}
				label={
					<div className="flex items-center gap-2">
						<span className="text-text-primary text-[0.75rem] font-semibold leading-[0.875rem]">
							{label}
						</span>
						<Tooltip content="Save">
							<ButtonTw
								variant="secondary"
								size="xss"
								onClick={handleCreateConfigClick}
							>
								<Icon name="Edit" className="size-5 mr-1.5" />
								<span>Create</span>
							</ButtonTw>
						</Tooltip>
					</div>
				}
			/>
		</>
	);
}

export { CreateNewConfigScreen };
