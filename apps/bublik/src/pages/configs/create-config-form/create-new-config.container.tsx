/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024 OKTET LTD */
import { useState, useRef, useEffect } from 'react';
import { Monaco } from '@monaco-editor/react';
import { toast } from 'sonner';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useForm, Controller } from 'react-hook-form';

import { useConfirm } from '@/shared/hooks';
import {
	bublikAPI,
	ConfigExistsError,
	ConfigValidationErrorSchema
} from '@/services/bublik-api';
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
	Icon,
	FormAlertError,
	ConfirmDialog
} from '@/shared/tailwind-ui';

import { useConfigPageSearchParams, useSavedState } from '../hooks';
import { getEditorValue, isValidJson, ValidJsonStringSchema } from '../utils';
import { ConfigEditor } from '../components/editor.component';
import { DEFAULT_PROJECT_LABEL } from '../config.constants';

const CreateConfigSchema = z.object({
	name: z.string().min(1, 'Name is required').max(32, 'Name is too long'),
	description: z.string().optional(),
	is_active: z.boolean(),
	project: z.number().optional().nullable(),
	content: ValidJsonStringSchema
});

type CreateConfigInputs = z.infer<typeof CreateConfigSchema>;

function CreateNewConfigScreen() {
	const { newConfigParams, setConfigId } = useConfigPageSearchParams();
	const [createConfigMutation, { isLoading }] =
		bublikAPI.useCreateConfigMutation();
	const projectsQuery = bublikAPI.useGetAllProjectsQuery();

	const editorRef = useRef<Monaco>();

	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

	const { savedValue: savedForm, setSavedValue } = useSavedState(
		JSON.stringify(newConfigParams)
	);

	const {
		confirmation: confirmationExisting,
		confirm: confirmExisting,
		decline: declineExisting,
		isVisible: isExistingVisible
	} = useConfirm();

	function handleCreateConfigClick() {
		const value = getEditorValue(editorRef.current);

		if (!isValidJson(value)) return toast.error('Failed to parse JSON');
		if (!newConfigParams) return toast.error('No config type provided');

		setIsCreateDialogOpen(true);
	}

	const form = useForm<CreateConfigInputs>({
		defaultValues: getSavedForm(),
		resolver: zodResolver(CreateConfigSchema)
	});

	async function handleCreateSubmit(data: CreateConfigInputs) {
		if (!newConfigParams) return toast.error('No config params present');

		const promise = createConfigMutation({
			type: newConfigParams.type,
			...data,
			content: JSON.parse(data.content)
		}).unwrap();

		toast.promise(promise, {
			success: 'Successfully created config',
			loading: 'Creating config...'
		});

		try {
			const result = await promise;
			setConfigId(result.id);
			form.reset();
			setIsCreateDialogOpen(false);
		} catch (e) {
			if (e instanceof ConfigExistsError) {
				setIsCreateDialogOpen(false);
				const shouldNavigate = await confirmationExisting();

				if (!shouldNavigate) return;

				setConfigId(e.configId);
			}
			const result = ConfigValidationErrorSchema.safeParse(e);
			if (!result.success) {
				form?.setError('root', {
					message: `Unknown error occured: ${String(e)}`
				});
				return;
			}

			if (typeof result.data.data.message === 'object') {
				Object.entries(result?.data.data.message).forEach(([key, error]) => {
					if (key === 'content') {
						form?.setError('root', { message: error.join('\n') });
						return;
					}

					// @ts-expect-error mapped frontend form field names to frontend so should be fine
					return form?.setError(key, { message: error.join('\n') });
				});
				return;
			}

			form?.setError('root', { message: result.data.data.message });
		}
	}

	function getSavedForm(): CreateConfigInputs {
		const defaultValues = {
			name:
				'name' in newConfigParams && newConfigParams.name
					? newConfigParams.name
					: newConfigParams.type,
			description: '',
			is_active: true,
			project:
				'project' in newConfigParams ? newConfigParams.project ?? null : null,
			content: savedForm ?? '{\n \n}'
		};

		if (savedForm) {
			try {
				return JSON.parse(savedForm);
			} catch {
				return defaultValues;
			}
		}

		return defaultValues;
	}

	const formValues = form.watch();
	useEffect(
		() => setSavedValue(JSON.stringify(formValues)),
		[formValues, setSavedValue]
	);

	const handleSubmit = (data: CreateConfigInputs) => {
		handleCreateSubmit(data);
	};

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

	if (schemaQuery.isLoading || projectsQuery.isLoading) {
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
					<form
						onSubmit={form.handleSubmit(handleSubmit)}
						className="flex flex-col gap-4"
					>
						<h2 className="text-xl font-semibold leading-tight text-text-primary">
							New Config
						</h2>
						{form.formState.errors.root ? (
							<div className="mb-6">
								<FormAlertError
									title={'Error'}
									description={form.formState.errors.root?.message}
								/>
							</div>
						) : null}
						<Controller
							name="project"
							control={form.control}
							render={({ field }) => (
								<div className="relative">
									<label className="font-normal text-text-secondary text-[0.875rem] absolute top-[-11px] left-2 bg-white">
										Project
									</label>
									<select
										{...field}
										value={field.value?.toString() ?? 'default'}
										onChange={(e) => {
											const value = e.target.value;
											field.onChange(
												value === 'default' ? null : parseInt(value, 10)
											);
										}}
										className="w-full px-3.5 py-[7px] outline-none border border-border-primary rounded text-text-secondary transition-all hover:border-primary disabled:text-text-menu disabled:cursor-not-allowed focus:border-primary focus:shadow-text-field active:shadow-none focus:ring-transparent"
									>
										<option value="default">{DEFAULT_PROJECT_LABEL}</option>
										{projectsQuery.data?.map((project) => (
											<option key={project.id} value={project.id.toString()}>
												{project.name}
											</option>
										))}
									</select>
								</div>
							)}
						/>
						<Controller
							name="name"
							control={form.control}
							render={({ field, fieldState }) => (
								<Input
									{...field}
									placeholder="per_conf"
									type="text"
									label="Name"
									error={fieldState.error?.message}
								/>
							)}
						/>

						<Controller
							name="description"
							control={form.control}
							render={({ field }) => (
								<div>
									<label
										htmlFor="description"
										className="font-normal text-text-secondary text-[0.875rem]"
									>
										Description
									</label>
									<textarea
										{...field}
										id="description"
										rows={4}
										className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
										placeholder="Enter description for the new config"
									/>
									{form.formState.errors.description && (
										<p className="mt-1 text-[0.75rem] font-normal text-bg-error">
											{form.formState.errors.description.message}
										</p>
									)}
								</div>
							)}
						/>
						<Controller
							name="is_active"
							control={form.control}
							render={({ field }) => (
								<label className="flex items-center">
									<Checkbox
										checked={field.value}
										onCheckedChange={field.onChange}
									/>
									<span className="ml-2 text-sm text-gray-700">
										Activate config?
									</span>
								</label>
							)}
						/>
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
			<ConfirmDialog
				open={isExistingVisible}
				title="Config Already Exists"
				description="A config with this content already exists. Do you want to navigate to the existing config?"
				onCancelClick={declineExisting}
				onConfirmClick={confirmExisting}
			/>
			<Controller
				name="content"
				control={form.control}
				render={({ field }) => (
					<ConfigEditor
						schema={schemaQuery.data}
						defaultValue={savedForm ?? '{\n \n}'}
						ref={editorRef}
						className={cn(isLoading && 'pointer-events-none opacity-40')}
						value={field.value}
						onChange={field.onChange}
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
				)}
			/>
		</>
	);
}

export { CreateNewConfigScreen };
