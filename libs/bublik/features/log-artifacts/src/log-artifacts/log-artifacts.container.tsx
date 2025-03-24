import { ComponentType } from 'react';

import {
	bublikAPI,
	GetLogArtifactByType,
	LogArtifactType
} from '@/services/bublik-api';
import {
	ButtonTw,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuTrigger,
	DropdownMenuItem,
	Icon,
	DropdownMenuLabel,
	Separator,
	DropdownMenuSub,
	DropdownMenuSubTrigger,
	DropdownMenuPortal,
	DropdownMenuSubContent,
	toast
} from '@/shared/tailwind-ui';

const ArtifactsMap: Record<
	LogArtifactType,
	ComponentType<{
		data: GetLogArtifactByType<LogArtifactType>;
		baseUrl: string;
	}>
> = {
	text: TextArtifact
};

function handleViewRawArtifact(
	data: GetLogArtifactByType<'text'>,
	baseUrl: string
) {
	if (data.view_type === 'inline') {
		if (data.uri) {
			window.open(data.uri, '_blank');
			return;
		}

		if (data.path) {
			window.open(baseUrl ? `${baseUrl}/${data.path}` : data.path, '_blank');
			return;
		}

		toast.error('No path or uri to view');
		return;
	}

	return;
}

async function handleDownloadArtifact(pathOrUri: string, baseUrl: string) {
	try {
		let url: string;
		let filename: string;

		try {
			const urlObj = new URL(pathOrUri);
			url = pathOrUri;
			filename = urlObj.pathname.split('/').pop() || 'download';
		} catch {
			url = `${baseUrl}/${pathOrUri}`;
			filename = pathOrUri.split('/').pop() || 'download';
		}

		if (!url) {
			toast.error('No url to download');
			return;
		}

		const response = await fetch(url, { credentials: 'include' });

		const blob = await response.blob();
		const downloadUrl = window.URL.createObjectURL(blob);
		const link = document.createElement('a');

		link.href = downloadUrl;
		link.download = filename;

		document.body.appendChild(link);

		link.click();
		link.remove();

		window.URL.revokeObjectURL(downloadUrl);
	} catch (error) {
		console.error('Failed to download artifact:', error);
	}
}

function TextArtifact({
	data,
	baseUrl
}: {
	data: GetLogArtifactByType<'text'>;
	baseUrl: string;
}) {
	const viewUrl =
		data.view_type === 'inline' && data.uri
			? data.uri
			: `${baseUrl}/${data.path}`;

	function handleViewArtifactClick() {
		if (data.view_type === 'inline') {
			handleViewRawArtifact(data, baseUrl);
			return;
		}

		toast.error('No view type for text artifact');
	}

	function handleDownloadArtifactClick() {
		if (!data.uri && !data.path) {
			toast.error('No path or uri to download');
			return;
		}

		handleDownloadArtifact(data.uri || data.path || '', baseUrl).catch(
			(error) => {
				console.error('Failed to download artifact:', error);
				toast.error('Failed to download artifact');
			}
		);
	}

	return (
		<DropdownMenuSub>
			<DropdownMenuSubTrigger className="pl-2 text-xs">
				<div className="mr-2 flex items-center">
					<Icon name="Paper" size={20} className="mr-2" />
					{data.name}
				</div>
			</DropdownMenuSubTrigger>

			<DropdownMenuPortal>
				<DropdownMenuSubContent>
					{data.view_type === 'inline' && viewUrl ? (
						<DropdownMenuItem asChild className="pl-2">
							<a href={viewUrl} target="_blank" rel="noopener noreferrer">
								<Icon name="EyeShow" size={20} className="mr-2" />
								View
							</a>
						</DropdownMenuItem>
					) : (
						<DropdownMenuItem
							onClick={handleViewArtifactClick}
							className="pl-2"
						>
							<Icon name="EyeShow" size={20} className="mr-2" />
							View
						</DropdownMenuItem>
					)}
					{data.download_enabled ? (
						<DropdownMenuItem
							onClick={handleDownloadArtifactClick}
							className="pl-2"
						>
							<Icon name="Download" size={20} className="mr-2" />
							Download
						</DropdownMenuItem>
					) : null}
				</DropdownMenuSubContent>
			</DropdownMenuPortal>
		</DropdownMenuSub>
	);
}

interface LogArtifactsContainerProps {
	runId: number;
	focusId: number | null;
}

function LogArtifactsContainer({ runId, focusId }: LogArtifactsContainerProps) {
	const { data, isLoading, error } = bublikAPI.useGetLogArtifactsQuery(
		focusId ?? runId
	);

	const isDisabled = error || !data;
	const artifacts = data?.data.artifacts || [];

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<ButtonTw
					variant="secondary"
					size="xss"
					state={isLoading ? 'loading' : isDisabled ? 'disabled' : 'default'}
				>
					{isLoading ? (
						<Icon
							name="ProgressIndicator"
							size={20}
							className="mr-1.5 animate-spin"
						/>
					) : (
						<Icon name="PaperStack" size={20} className="mr-1.5" />
					)}
					Artifacts
				</ButtonTw>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start" sideOffset={8}>
				<DropdownMenuLabel className="py-2 text-xs">
					Artifacts
				</DropdownMenuLabel>
				<Separator className="h-px my-1" />

				{artifacts.length === 0 ? (
					<DropdownMenuItem disabled>No artifacts available</DropdownMenuItem>
				) : (
					artifacts.map((artifact, idx) => {
						const Component = ArtifactsMap[artifact.type];

						if (!Component) return null;

						return (
							<Component
								key={idx}
								data={artifact}
								baseUrl={data?.artifact_base_url ?? ''}
							/>
						);
					})
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

export { LogArtifactsContainer };
