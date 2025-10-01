/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024 OKTET LTD */
import { forwardRef, ReactNode, useEffect, useImperativeHandle } from 'react';
import { useForm, Controller, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { ConfigVersionResponse } from '@/services/bublik-api';
import {
	ButtonTw,
	Checkbox,
	Dialog,
	DialogContent,
	DialogOverlay,
	dialogContentStyles,
	dialogOverlayStyles,
	cn,
	Icon,
	Tooltip,
	Input,
	FormAlertError
} from '@/shared/tailwind-ui';

import { ConfigEditor } from '../components/editor.component';
import {
	CurrentBadge,
	InactiveBadge,
	ModifiedBadge
} from '../components/badges.component';
import { useSavedState } from '../hooks';
import { ConfigVersions } from '../versions/config-versions';
import { ValidJsonStringSchema } from '../utils';

const ConfigFormSchema = z.object({
	name: z.string(),
	content: ValidJsonStringSchema,
	description: z.string().optional(),
	is_active: z.boolean()
});

type ConfigFormData = z.infer<typeof ConfigFormSchema>;

interface ConfigEditorFormProps {
	defaultValues: ConfigFormData;
	onSubmit: (data: Partial<ConfigFormData>) => void;
	schema?: Record<string, unknown>;
	isLoading?: boolean;
	label: ReactNode;
	config: { id: number; is_active: boolean };
	versions: ConfigVersionResponse['all_config_versions'];
	setConfigId: (id: number) => void;
	handleMarkAsCurrent: (id: number) => void;
	handleDeleteClick: (id: number) => void;
	isOpen: boolean;
	setIsOpen: (isOpen: boolean) => void;
	isAdmin?: boolean;
}

const ConfigEditorForm = forwardRef<
	UseFormReturn<ConfigFormData>,
	ConfigEditorFormProps
>((props, ref) => {
	const {
		defaultValues,
		onSubmit,
		schema,
		isLoading,
		label,
		config,
		versions,
		setConfigId,
		handleMarkAsCurrent,
		handleDeleteClick,
		isOpen,
		setIsOpen,
		isAdmin
	} = props;
	const { savedValue, setSavedValue } = useSavedState(config.id.toString());

	function getSavedForm(): ConfigFormData {
		if (savedValue) {
			try {
				return JSON.parse(savedValue);
			} catch {
				return defaultValues;
			}
		}
		return defaultValues;
	}

	const form = useForm<ConfigFormData>({
		defaultValues: getSavedForm(),
		resolver: zodResolver(ConfigFormSchema)
	});

	useImperativeHandle(ref, () => form);

	const formValues = form.watch();
	useEffect(
		() => setSavedValue(JSON.stringify(formValues)),
		[formValues, setSavedValue]
	);

	const handleSaveClick = () => {
		if (!ValidJsonStringSchema.safeParse(form.getValues('content')).success) {
			return alert('Invalid JSON. Please check your input.');
		}

		setIsOpen(true);
	};

	function handleResetToOriginalClick() {
		form.reset(defaultValues);
	}

	const isModified =
		JSON.stringify(formValues) !== JSON.stringify(defaultValues);

	function handleSubmit(data: ConfigFormData) {
		const dirtyFields = form.formState.dirtyFields;

		if (Object.keys(dirtyFields).length === 0) return;

		const changedData = Object.fromEntries(
			Object.keys(dirtyFields)
				.filter((key): key is keyof ConfigFormData => key in data)
				.map((key) => [key, data[key]])
		) as Partial<ConfigFormData>;

		onSubmit(changedData);
	}

	return (
		<>
			<Dialog open={isOpen} onOpenChange={setIsOpen}>
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
						<h2 className="mb-4 text-xl font-semibold leading-tight text-text-primary">
							Update Config
						</h2>
						{form.formState.errors.root ? (
							<div className="mb-6">
								<FormAlertError
									title={'Error'}
									description={form.formState.errors.root.message}
								/>
							</div>
						) : null}

						<Controller
							name="name"
							control={form.control}
							render={({ field, fieldState }) => {
								return (
									<Input
										{...field}
										placeholder="per_conf"
										type="text"
										label="Name"
										error={fieldState.error?.message}
									/>
								);
							}}
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

						<div>
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
											Config Active
										</span>
									</label>
								)}
							/>
						</div>
						<div className="flex justify-end gap-2">
							<ButtonTw
								variant="secondary"
								type="button"
								onClick={() => setIsOpen(false)}
							>
								Cancel
							</ButtonTw>
							<ButtonTw
								type="submit"
								variant="primary"
								disabled={!form.formState.isValid}
							>
								Save
							</ButtonTw>
						</div>
					</form>
				</DialogContent>
			</Dialog>
			<Controller<ConfigFormData, 'content'>
				name="content"
				control={form.control}
				render={({ field }) => (
					<ConfigEditor
						schema={schema}
						value={field.value}
						onChange={field.onChange}
						readOnly={!isAdmin}
						className={cn(isLoading && 'opacity-40 pointer-events-none')}
						label={
							<UpdateConfigLabelContainer
								label={label}
								config={config}
								versions={versions}
								isModified={isModified}
								handleResetToOriginalClick={handleResetToOriginalClick}
								setConfigId={setConfigId}
								handleMarkAsCurrent={handleMarkAsCurrent}
								handleDeleteClick={handleDeleteClick}
								handleSaveClick={handleSaveClick}
								isAdmin={isAdmin}
							/>
						}
					/>
				)}
			/>
		</>
	);
});

interface UpdateConfigLabelContainerProps {
	label: ReactNode;
	config: { id: number; is_active: boolean };
	versions: ConfigVersionResponse['all_config_versions'];
	isModified: boolean;
	handleResetToOriginalClick: () => void;
	setConfigId: (id: number) => void;
	handleMarkAsCurrent: (id: number) => void;
	handleDeleteClick: (id: number) => void;
	handleSaveClick: () => void;
	isAdmin?: boolean;
}

function UpdateConfigLabelContainer(props: UpdateConfigLabelContainerProps) {
	const {
		label,
		config,
		versions,
		isModified,
		handleResetToOriginalClick,
		setConfigId,
		handleMarkAsCurrent,
		handleDeleteClick,
		handleSaveClick,
		isAdmin
	} = props;

	return (
		<div className="flex items-center gap-2">
			<div className="flex items-center gap-2">
				<span className="text-text-primary text-[0.75rem] font-semibold leading-[0.875rem]">
					{label}
				</span>
				{config.is_active ? <CurrentBadge /> : <InactiveBadge />}
				{isModified ? (
					<ModifiedBadge onClick={handleResetToOriginalClick} />
				) : null}
			</div>
			<ConfigVersions
				configId={config.id}
				versions={versions ?? []}
				onVersionClick={setConfigId}
			/>
			<Tooltip content="Login as an admin to update config" disabled={isAdmin}>
				<ButtonTw
					variant="secondary"
					size="xss"
					disabled={!isAdmin}
					onClick={handleSaveClick}
					className="pointer-events-auto"
				>
					<Icon name="Edit" className="size-5 mr-1.5" />
					<span>Update</span>
				</ButtonTw>
			</Tooltip>
			<Tooltip
				content="Login as an admin to activate or deactivate config"
				disabled={isAdmin}
			>
				<ButtonTw
					variant={config.is_active ? 'destruction-secondary' : 'secondary'}
					size="xss"
					onClick={() => handleMarkAsCurrent(config.id)}
					disabled={!isAdmin}
					className="pointer-events-auto"
				>
					<Icon name="Edit" className="size-5 mr-1.5" />
					<span>{config.is_active ? 'Deactivate' : 'Activate'}</span>
				</ButtonTw>
			</Tooltip>
			<Tooltip content="Login as an admin to delete config" disabled={isAdmin}>
				<ButtonTw
					variant="destruction-secondary"
					size="xss"
					onClick={() => handleDeleteClick(config.id)}
					disabled={!isAdmin}
					className="pointer-events-auto"
				>
					<Icon name="Bin" className="size-5 mr-1.5" />
					<span>Delete</span>
				</ButtonTw>
			</Tooltip>
		</div>
	);
}

export { ConfigEditorForm };
