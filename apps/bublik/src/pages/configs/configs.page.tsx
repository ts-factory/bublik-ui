/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024 OKTET LTD */
import {
	bublikAPI,
	ConfigItem,
	ConfigSchemaParams,
	ConfigSchemaParamsSchema,
	ConfigVersionResponse
} from '@/services/bublik-api';
import MonacoEditor, { Monaco, OnMount } from '@monaco-editor/react';
import {
	ComponentProps,
	ComponentPropsWithoutRef,
	forwardRef,
	Fragment,
	MutableRefObject,
	useCallback,
	useEffect,
	useImperativeHandle,
	useRef,
	useState
} from 'react';
import { format } from 'prettier';
import { format as formatTime } from 'date-fns';
import parserJson from 'prettier/parser-babel';
import { useQueryParam, NumberParam, JsonParam } from 'use-query-params';

import {
	ButtonTw,
	CardHeader,
	Checkbox,
	cn,
	ConfirmDialog,
	Dialog,
	DialogContent,
	dialogContentStyles,
	DialogOverlay,
	dialogOverlayStyles,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
	Icon,
	Input,
	Popover,
	PopoverContent,
	PopoverTrigger,
	Separator,
	Skeleton,
	toast,
	Tooltip
} from '@/shared/tailwind-ui';

import { z } from 'zod';
import { useSessionStorage, useUnmount } from 'react-use';
import { useBeforeUnload } from 'react-router-dom';
import { groupBy } from 'remeda';
import { upperCaseFirstLetter } from '@/shared/utils';
import { skipToken } from '@reduxjs/toolkit/query';
import { useConfirm } from '@/shared/hooks';

// MARK: Constants
const DEFAULT_URI = 'memory://model';

// MARK: Utils
const ValidationErrorSchema = z.object({
	status: z.number(),
	data: z.object({
		type: z.string(),
		message: z.record(z.array(z.string()))
	})
});

function formatTimeV(date: string): string {
	return `${formatTime(new Date(date), 'MMM dd, yyyy')} at ${formatTime(
		new Date(date),
		'HH:mm'
	)}`;
}

function isValidJson(jsonStr: string): boolean {
	try {
		JSON.parse(jsonStr);
		return true;
	} catch (error) {
		return false;
	}
}

function getEditorValue(monaco?: Monaco, uri = DEFAULT_URI): string {
	if (!monaco) {
		return '';
	}

	const URI = monaco.Uri.parse(uri);

	if (!URI) {
		return '';
	}

	return monaco.editor.getModel(URI)?.getValue() ?? '';
}

// MARK: Hooks
function useConfigPageSearchParams() {
	const [configId, _setConfigId] = useQueryParam('configId', NumberParam);
	const [_newConfigParams, setNewConfigParams] =
		useQueryParam<ConfigSchemaParams | null>('new_config', JsonParam);

	function setConfigId(configId: number | null) {
		setNewConfigParams(null);
		_setConfigId(configId);
	}

	const newConfigParams = ConfigSchemaParamsSchema.safeParse(_newConfigParams)
		.success
		? ConfigSchemaParamsSchema.parse(_newConfigParams)
		: null;

	return { configId, setConfigId, newConfigParams, setNewConfigParams };
}

function useSavedState(
	key: string,
	editorRef?: MutableRefObject<Monaco | undefined>
) {
	const [savedValue, setSavedValue] = useSessionStorage<string>(key);

	const handleBeforeUnload = useCallback(() => {
		const value = getEditorValue(editorRef?.current);
		if (!value) return;
		setSavedValue(value);
	}, [editorRef, setSavedValue]);

	useBeforeUnload(handleBeforeUnload);
	useUnmount(handleBeforeUnload);

	return { savedValue, setSavedValue };
}

function useConfigById(configId: number) {
	const configQuery = bublikAPI.useGetConfigByIdQuery({ id: configId });
	const versionsQuery = bublikAPI.useGetAllVersionsOfConfigByIdQuery({
		id: configId
	});
	const schemaQuery = bublikAPI.useGetConfigSchemaQuery(
		configQuery.data
			? { name: configQuery.data.name, type: configQuery.data.type }
			: skipToken
	);
	const [deleteMutation] = bublikAPI.useDeleteConfigByIdMutation();
	const [editMutation] = bublikAPI.useEditConfigByIdMutation();
	const [markAsCurrentMutation] = bublikAPI.useMarkConfigAsCurrentMutation();

	async function deleteConfig(id: number) {
		const promise = deleteMutation(id).unwrap();
		toast.promise(promise, {
			success: 'Succesfully deleted config',
			error: 'Failed to delete config',
			loading: 'Deleting config...'
		});
	}

	function updateConfig(params: Parameters<typeof editMutation>[0]['body']) {
		const promise = editMutation({ id: configId, body: params }).unwrap();

		toast.promise(promise, {
			success: 'Succesfully updated config',
			error: (e) => {
				try {
					const {
						data: { message }
					} = ValidationErrorSchema.parse(e);
					const errorMessage = Object.entries(message)
						.map(([key, error]) => `${key}: ${error}`)
						.flat()
						.join('\n');

					return errorMessage;
				} catch (parseError) {
					console.error(parseError);
				}

				return 'Failed to update config';
			},
			loading: 'Updating config...'
		});

		return promise;
	}

	function markAsCurrent(params: Parameters<typeof markAsCurrentMutation>[0]) {
		const promise = markAsCurrentMutation(params).unwrap();
		toast.promise(promise, {
			success: 'Succesfully activated config',
			error: 'Failed to activate config',
			loading: 'Activating config...'
		});
	}

	return {
		isLoading:
			configQuery.isLoading || versionsQuery.isLoading || schemaQuery.isLoading,
		error: configQuery.error || versionsQuery.error || schemaQuery.error,
		isFetching:
			configQuery.isFetching ||
			versionsQuery.isFetching ||
			schemaQuery.isFetching,
		config: configQuery.data,
		versions: versionsQuery.data,
		schema: schemaQuery.data,
		deleteConfig,
		updateConfig,
		markAsCurrent
	};
}

function formatJson(value: string) {
	return format(value, { parser: 'json', plugins: [parserJson] });
}

function useShouldMigrateGlobalConfig() {
	const { data, isLoading, error } = bublikAPI.useGetListOfConfigsQuery();
	const [mutate] = bublikAPI.useMigrateGlobalConfigMutation();
	const { setConfigId } = useConfigPageSearchParams();

	const shouldMigrate = !data?.find(
		(config) => config.name === 'per_conf' && config.type === 'global'
	);

	async function migrateGlobalConfig() {
		try {
			const promise = mutate().unwrap();

			toast.promise(promise, {
				error: 'Failed to migrate config.',
				success: 'Succesfully migrated config',
				loading: 'Migrating global config...'
			});
			const result = await promise;
			setConfigId(result.id);
		} catch (_) {
			//
		}
	}

	return { shouldMigrate, isLoading, error, migrateGlobalConfig };
}

// MARK: Page
function ConfigsPage() {
	const { configId, newConfigParams } = useConfigPageSearchParams();
	const { shouldMigrate, error, isLoading, migrateGlobalConfig } =
		useShouldMigrateGlobalConfig();

	if (error) {
		return (
			<h1 className="grid place-items-center h-full w-full">
				Failed to fetch global config!
			</h1>
		);
	}

	if (isLoading) {
		return (
			<Skeleton className="rounded-md h-full overflow-hidden w-full m-2" />
		);
	}

	if (shouldMigrate) {
		return (
			<div className="grid place-items-center h-full w-full">
				<div className="rounded-lg border bg-white shadow-sm w-full max-w-md">
					<div className="flex flex-col space-y-1.5 p-6">
						<h3 className="whitespace-nowrap text-2xl font-semibold leading-none tracking-tight">
							Migrate Global Config
						</h3>
						<p className="text-sm text-muted-foreground">
							This action will attempt to migrate the global configuration.
						</p>
					</div>
					<div className="p-6" data-id="5">
						<p className="text-sm text-muted-foreground">
							Migrating the global configuration will update your system
							settings. Please ensure you have a backup before proceeding.
						</p>
					</div>
					<div className="flex items-center w-full p-6">
						<ButtonTw className="w-full" onClick={migrateGlobalConfig}>
							Migrate
						</ButtonTw>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="p-2 h-full flex gap-1">
			<div className="bg-white rounded-md h-full w-[320px] overflow-hidden">
				<ConfigsSidebarContainer />
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

function ConfigsSidebarContainer() {
	const configsQuery = bublikAPI.useGetListOfConfigsQuery();
	const { setConfigId, configId, setNewConfigParams } =
		useConfigPageSearchParams();
	const prefetchConfigById = bublikAPI.usePrefetch('getConfigById');
	const prefetchConfigVersions = bublikAPI.usePrefetch(
		'getAllVersionsOfConfigById'
	);
	const prefetchSchema = bublikAPI.usePrefetch('getConfigSchema');

	useEffect(() => {
		if (!configsQuery.data) return;

		configsQuery.data.forEach(({ id, type, name }) => {
			prefetchConfigById({ id });
			prefetchConfigVersions({ id });
			prefetchSchema({ type: 'report' });
			prefetchSchema({ type, name });
		});
	}, [
		configsQuery.data,
		prefetchConfigById,
		prefetchConfigVersions,
		prefetchSchema
	]);

	function handleCreateNewConfigClick(params: ConfigSchemaParams) {
		setConfigId(null);
		setNewConfigParams(params);
	}

	if (configsQuery.error) {
		return <div>Error...</div>;
	}

	if (configsQuery.isLoading) {
		return (
			<div className="flex flex-col h-full">
				<SidebarHeader
					onCreateNewConfigClick={handleCreateNewConfigClick}
					configId={configId}
				/>
				<Skeleton className="h-full" />
			</div>
		);
	}

	if (!configsQuery.data?.length || !configsQuery.data) {
		return (
			<div className="flex flex-col h-full">
				<SidebarHeader
					onCreateNewConfigClick={handleCreateNewConfigClick}
					configId={configId}
				/>
				<div className="flex-1 grid place-items-center">
					<div className="flex flex-col items-center justify-center flex-1 p-4 text-center">
						<Icon
							name="SettingsSliders"
							className="size-12 mb-4 text-text-menu"
						/>
						<h3 className="text-lg font-semibold mb-2">
							No configurations yet
						</h3>
						<p className="text-sm text-text-menu mb-4">
							Create your first configuration to get started.
						</p>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="flex flex-col h-full">
			<SidebarHeader
				onCreateNewConfigClick={handleCreateNewConfigClick}
				configId={configId}
			/>
			<ConfigList
				versions={configsQuery.data}
				isFetching={configsQuery.isFetching}
				currentConfigId={configId}
				onConfigClick={setConfigId}
			/>
		</div>
	);
}

interface SidebarHeaderProps {
	configId?: number | null;
	onCreateNewConfigClick?: (params: ConfigSchemaParams) => void;
}

function SidebarHeader(props: SidebarHeaderProps) {
	const { onCreateNewConfigClick, configId } = props;

	return (
		<CardHeader
			label={
				<div className="flex items-center gap-2">
					<span className="text-text-primary text-[0.75rem] font-semibold leading-[0.875rem]">
						Configs
					</span>
				</div>
			}
		>
			<div className="flex items-center gap-4">
				<DropdownMenu>
					<Tooltip content="Create New Config">
						<DropdownMenuTrigger asChild>
							<ButtonTw
								variant="secondary"
								size="xss"
								state={!configId && 'active'}
							>
								<Icon name="FilePlus" className="size-5 mr-1.5" />
								<span>New</span>
							</ButtonTw>
						</DropdownMenuTrigger>
					</Tooltip>
					<DropdownMenuContent sideOffset={8} align="start">
						<DropdownMenuLabel>New Config </DropdownMenuLabel>
						<DropdownMenuSeparator />
						<DropdownMenuItem
							className="pl-2"
							onSelect={() =>
								onCreateNewConfigClick?.({ name: 'per_conf', type: 'global' })
							}
						>
							<Icon name="AddSymbol" className="size-5 mr-1.5" />
							<span>Global</span>
						</DropdownMenuItem>
						<DropdownMenuItem
							className="pl-2"
							onSelect={() => onCreateNewConfigClick?.({ type: 'report' })}
						>
							<Icon name="AddSymbol" className="size-5 mr-1.5" />
							<span>Report</span>
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</CardHeader>
	);
}

interface ConfigListProps {
	versions: ConfigItem[];
	isFetching?: boolean;
	currentConfigId?: number | null;
	onConfigClick?: (id: number) => void;
}

function ConfigList({
	versions,
	currentConfigId,
	isFetching,
	onConfigClick
}: ConfigListProps) {
	const grouped = groupBy(
		versions.toSorted((a) => (a.type === 'global' ? -1 : 1)),
		(config) => config.type
	);

	return (
		<ul
			className={cn('flex flex-col overflow-auto', isFetching && 'opacity-40')}
		>
			{Object.entries(grouped).map(([type, configs], idx, arr) => {
				return (
					<div key={type}>
						<div className="flex items-center gap-2 justify-between pr-2 pl-4 py-1.5">
							<h2 className="text-sm font-semibold">
								{upperCaseFirstLetter(type)}
							</h2>
						</div>
						<Separator />
						{configs.map((config) => (
							<ConfigListItem
								key={config.id}
								config={config}
								isActive={currentConfigId === config.id}
								onClick={onConfigClick}
							/>
						))}
						{idx !== arr.length - 1 ? <Separator /> : null}
					</div>
				);
			})}
		</ul>
	);
}

interface ConfigListItemProps {
	config: ConfigItem;
	isActive?: boolean;
	onClick?: (id: number) => void;
}

function ConfigListItem({ config, isActive, onClick }: ConfigListItemProps) {
	return (
		<li key={config.id} className="min-h-16 flex flex-col">
			<button
				className={cn(
					'hover:bg-primary-wash rounded flex flex-col gap-1 px-2.5 py-2 text-xs w-full h-full flex-1',
					isActive && 'bg-primary-wash'
				)}
				onClick={() => onClick?.(config.id)}
			>
				<div className="flex items-center justify-between gap-2 w-full">
					<div className="flex items-center gap-2">
						<span className="font-semibold text-xs whitespace-nowrap truncate">
							{config.name} {`#${config.version}` ?? ''}
						</span>
						{!config.is_active ? <InactiveBadge /> : null}
					</div>
					<span className="text-slate-500 text-xs whitespace-nowrap">
						{formatTimeV(config.created)}
					</span>
				</div>
				<p className="text-xs w-full text-left flex-1 overflow-wrap-anywhere">
					{config.description}
				</p>
			</button>
		</li>
	);
}

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
	const editorRef = useRef<Monaco>();
	const { setConfigId, setNewConfigParams } = useConfigPageSearchParams();
	const { savedValue, setSavedValue } = useSavedState(
		configId.toString(),
		editorRef
	);
	const [value, setValue] = useState('');
	const [isDescriptionDialogOpen, setIsDescriptionDialogOpen] = useState(false);
	const [description, setDescription] = useState('');
	const [pendingValue, setPendingValue] = useState('');
	const { confirm, confirmation, decline, isVisible } = useConfirm();
	const markConfirm = useConfirm();
	const [isActive, setIsActive] = useState(false);

	useEffect(() => {
		if (config) {
			const configValue = savedValue
				? savedValue
				: formatJson(JSON.stringify(config.content, null, 2));
			setValue(configValue);
		}
	}, [config, savedValue, setSavedValue]);

	async function handleSaveClick() {
		const value = getEditorValue(editorRef.current);
		if (!isValidJson(value)) return toast.error('Failed to parse JSON');

		setPendingValue(value);
		setIsActive(config?.is_active ?? false);
		setIsDescriptionDialogOpen(true);
	}

	async function handleDescriptionSubmit(e: React.FormEvent) {
		e.preventDefault();
		setIsDescriptionDialogOpen(false);

		const result = await updateConfig({
			content: JSON.parse(pendingValue),
			description: description,
			is_active: isActive
		});

		setSavedValue('');
		setConfigId(result.id);
		setDescription('');
	}

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

	function handleResetToOriginalClick() {
		if (!config) return;
		const nextvalue = formatJson(JSON.stringify(config.content, null, 2));
		setValue(nextvalue);
		setSavedValue(nextvalue);
	}

	if (error) {
		return <div>Error...</div>;
	}

	if (isLoading) {
		return <Skeleton className="h-full" />;
	}

	if (!config) {
		return <div>No Data...</div>;
	}

	const configValue = formatJson(JSON.stringify(config.content, null, 2));
	const label = `${config.name}`;
	const isModified =
		savedValue !== '' &&
		typeof savedValue !== 'undefined' &&
		savedValue !== configValue;

	return (
		<>
			<Dialog
				open={isDescriptionDialogOpen}
				onOpenChange={setIsDescriptionDialogOpen}
			>
				<DialogOverlay className={dialogOverlayStyles()} />
				<DialogContent
					className={cn(
						dialogContentStyles(),
						'sm:max-w-md p-6 bg-white sm:rounded-lg md:shadow min-w-[420px] overflow-auto max-h-[85vh]'
					)}
				>
					<form onSubmit={handleDescriptionSubmit}>
						<h2 className="mb-1 text-xl font-semibold leading-tight text-text-primary">
							Update Config
						</h2>
						<p className="text-sm text-slate-600 mb-4">
							Provide a description of the changes you've made
						</p>
						<textarea
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder="Enter a description for this update..."
							className={cn(
								'w-full px-3.5 py-[7px] outline-none border border-border-primary rounded text-text-secondary transition-all hover:border-primary disabled:text-text-menu disabled:cursor-not-allowed focus:border-primary focus:shadow-text-field active:shadow-none focus:ring-transparent text-sm'
							)}
							rows={4}
						/>
						<div className="mt-4">
							<label className="flex items-center">
								<Checkbox
									checked={isActive}
									onCheckedChange={(checked) => setIsActive(Boolean(checked))}
								/>
								<span className="ml-2 text-sm">Activate config?</span>
							</label>
						</div>
						<div className="flex justify-end gap-2 mt-4">
							<ButtonTw
								type="button"
								variant="secondary"
								onClick={() => setIsDescriptionDialogOpen(false)}
							>
								Cancel
							</ButtonTw>
							<ButtonTw type="submit" variant="primary">
								Save
							</ButtonTw>
						</div>
					</form>
				</DialogContent>
			</Dialog>
			<ConfirmDialog
				open={isVisible}
				title={config.is_active ? 'Deactivate Config?' : 'Activate Config?'}
				description="This action can not be undone."
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
			<ConfigEditor
				value={value}
				schema={schema}
				className={cn(isFetching && 'opacity-40 pointer-events-none')}
				ref={editorRef}
				onChange={(v) => {
					setSavedValue(v ?? '');
					setValue(v ?? '');
				}}
				label={
					<div className="flex items-center gap-2">
						<div className="flex items-center gap-2">
							<span className="text-text-primary text-[0.75rem] font-semibold leading-[0.875rem]">
								{label} #{config.version}
							</span>
							{config.is_active ? <CurrentBadge /> : <InactiveBadge />}
							{isModified ? (
								<ModifiedBadge onClick={handleResetToOriginalClick} />
							) : null}
						</div>
						<ConfigVersions
							configId={config.id}
							versions={versions?.all_config_versions ?? []}
							onVersionClick={setConfigId}
						/>
						<Tooltip content="Update">
							<ButtonTw
								variant="secondary"
								size="xss"
								onClick={handleSaveClick}
								disabled={!isModified}
							>
								<Icon name="Edit" className="size-5 mr-1.5" />
								<span>Update</span>
							</ButtonTw>
						</Tooltip>
						<Tooltip content="Activate">
							<ButtonTw
								variant={
									config.is_active ? 'destruction-secondary' : 'secondary'
								}
								size="xss"
								onClick={() => handleMarkAsCurrent(configId)}
							>
								<Icon name="Edit" className="size-5 mr-1.5" />
								<span>{config.is_active ? 'Deactivate' : 'Activate'}</span>
							</ButtonTw>
						</Tooltip>
						<Tooltip content="Delete Config">
							<ButtonTw
								variant="destruction-secondary"
								size="xss"
								onClick={() => handleDeleteClick(configId)}
							>
								<Icon name="Bin" className="size-5 mr-1.5" />
								<span>Delete</span>
							</ButtonTw>
						</Tooltip>
					</div>
				}
			/>
		</>
	);
}

function CurrentBadge() {
	return (
		<div className="bg-purple-100 text-purple-800 px-2.5 py-0.5 rounded text-[0.6875rem] font-medium">
			ACTIVE
		</div>
	);
}

function InactiveBadge() {
	return (
		<div className="text-[0.6875rem] bg-gray-200 text-gray-900 text-xs font-medium me-2 px-2.5 py-0.5 rounded">
			INACTIVE
		</div>
	);
}

function ModifiedBadge(props: ComponentPropsWithoutRef<'button'>) {
	return (
		<div className="bg-indigo-100 text-indigo-800 pl-2.5 pr-1.5 py-0.5 rounded text-[0.6875rem] font-medium flex items-center">
			<span>MODIFIED</span>
			<Separator
				orientation="vertical"
				className="h-[14px] bg-indigo-800 mx-1.5"
			/>
			<Tooltip content="Remove modifications">
				<button
					aria-label="Reset To Original"
					className="hover:bg-indigo-500 rounded hover:text-white relative"
					{...props}
				>
					<Icon name="Refresh" className="size-5 scale-x-[-1]" />
				</button>
			</Tooltip>
		</div>
	);
}

interface ConfigVersionsProps {
	configId: number;
	versions: ConfigVersionResponse['all_config_versions'];
	onVersionClick?: (id: number) => void;
}

function ConfigVersions({
	versions,
	onVersionClick,
	configId
}: ConfigVersionsProps) {
	const [open, setOpen] = useState(false);

	const hasAnother = Boolean(versions.filter((v) => v.id !== configId).length);

	return (
		<Popover onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<ButtonTw
					variant="secondary"
					size="xss"
					disabled={!hasAnother}
					state={open && 'active'}
				>
					<Icon name="Clock" className="size-5 mr-1.5" />
					<span>Versions</span>
				</ButtonTw>
			</PopoverTrigger>
			<PopoverContent
				sideOffset={4}
				align="start"
				className="bg-white py-2 shadow-popover rounded-md flex flex-col max-w-80 text-xs max-h-96"
			>
				<span className="pr-2 pl-4 py-1.5 text-sm font-semibold">Versions</span>
				<Separator />
				<ConfigVersionList
					versions={versions}
					onVersionClick={onVersionClick}
				/>
			</PopoverContent>
		</Popover>
	);
}

interface ConfigVersionListProps {
	versions: ConfigVersionResponse['all_config_versions'];
	onVersionClick?: (id: number) => void;
}

function ConfigVersionList({
	versions,
	onVersionClick
}: ConfigVersionListProps) {
	return (
		<ul className="flex flex-col flex-1 overflow-auto">
			{versions.map((version, idx, arr) => (
				<Fragment key={version.id}>
					<ConfigVersionListItem
						version={version}
						onVersionClick={onVersionClick}
					/>
					{idx !== arr.length - 1 ? <Separator /> : null}
				</Fragment>
			))}
		</ul>
	);
}

interface ConfigVersionListItemProps {
	version: ConfigVersionResponse['all_config_versions'][number];
	onVersionClick?: (id: number) => void;
}

function ConfigVersionListItem({
	version,
	onVersionClick
}: ConfigVersionListItemProps) {
	return (
		<li className="min-h-16 flex flex-col">
			<button
				className={cn(
					'w-full px-4 py-2 flex flex-col gap-2 hover:bg-primary-wash h-full flex-1'
				)}
				onClick={() => onVersionClick?.(version.id)}
			>
				<div className="flex items-center justify-between gap-2 w-full">
					<div className="flex items-center gap-2">
						<span className="font-semibold text-xs">
							Version #{version.version}
						</span>
						{version.is_active ? <CurrentBadge /> : null}
					</div>
					<span className="text-slate-500 text-xs">
						{formatTimeV(version.created)}
					</span>
				</div>
				<p className="text-left w-full flex-1 overflow-wrap-anywhere">
					{version.description}
				</p>
			</button>
		</li>
	);
}

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

// MARK: Editor
interface ConfigEditorProps extends ComponentProps<typeof MonacoEditor> {
	schema?: Record<string, unknown>;
	label?: ComponentProps<typeof CardHeader>['label'];
}

const ConfigEditor = forwardRef<Monaco | undefined, ConfigEditorProps>(
	({ schema, label, className, ...props }, ref) => {
		const [monaco, setMonaco] = useState<Monaco>();
		const editorRef = useRef<Parameters<OnMount>[0] | null>(null);

		useImperativeHandle(ref, () => monaco, [monaco]);

		function handleEditorWillMount(monaco: Monaco) {
			monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
				validate: true,
				schemas: [{ fileMatch: ['*'], schema: schema, uri: '' }]
			});
			monaco.languages.typescript.javascriptDefaults.setEagerModelSync(true);
			setMonaco(monaco);
		}

		const handleEditorDidMount: OnMount = (editor, monaco) => {
			editorRef.current = editor;

			editor.addCommand(
				monaco.KeyMod.CtrlCmd | monaco.KeyCode.Backslash,
				() => {
					editor.trigger('keyboard', 'editor.action.triggerSuggest', {});
				}
			);
		};

		function handleFormatClick() {
			const URI = monaco?.Uri.parse(DEFAULT_URI);
			if (!URI) {
				toast.error('Failed to create URI');
				return;
			}

			const model = monaco?.editor.getModel(URI);

			if (!model) {
				toast.error(`Failed to get model by ${URI}`);
				return;
			}

			const value = model.getValue();
			try {
				const formatted = formatJson(value);
				model.setValue(formatted);
			} catch (error) {
				toast.error('Failed to format JSON');
				console.error(error);
			}
		}

		return (
			<div className="flex flex-col h-full">
				<CardHeader label={label ?? 'Editor'}>
					<div className="flex items-center gap-4">
						<Tooltip content="Format JSON">
							<ButtonTw
								variant="secondary"
								size="xss"
								onClick={handleFormatClick}
							>
								<Icon name="Edit" className="size-5 mr-1.5" />
								<span>Format</span>
							</ButtonTw>
						</Tooltip>
					</div>
				</CardHeader>
				<div className={cn('flex-1', className)}>
					<MonacoEditor
						language="json"
						path={DEFAULT_URI}
						beforeMount={handleEditorWillMount}
						onMount={handleEditorDidMount}
						options={{ fontSize: 14 }}
						loading={null}
						{...props}
					/>
				</div>
			</div>
		);
	}
);

export { ConfigsPage };
