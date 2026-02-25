import { LinkWithProject } from '@/bublik/features/projects';

import { bublikAPI, GetLogAttachmentByType } from '@/services/bublik-api';
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

function handleViewRawAttachment(
	data: GetLogAttachmentByType<'text'>,
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

interface DownloadAttachmentOptions {
	runId?: number;
	resultId?: number;
}

async function handleDownloadAttachments(
	pathOrUri: string,
	baseUrl: string,
	options?: DownloadAttachmentOptions
) {
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

		let downloadFilename = filename;
		if (options?.runId || options?.resultId) {
			const prefixParts = [];
			if (options?.runId) prefixParts.push(options.runId);
			if (options?.resultId) prefixParts.push(options.resultId);

			downloadFilename = `${prefixParts.join('_')}_${filename}`;
		}

		link.download = downloadFilename;

		document.body.appendChild(link);

		link.click();
		link.remove();

		window.URL.revokeObjectURL(downloadUrl);
	} catch (error) {
		console.error('Failed to download attachment:', error);
	}
}

interface TextAttachmentProps {
	data: GetLogAttachmentByType<'text'>;
	baseUrl: string;
	runId?: number;
	resultId?: number;
}

function TextAttachment({
	data,
	baseUrl,
	runId,
	resultId
}: TextAttachmentProps) {
	const viewUrl =
		data.view_type === 'inline' && data.uri
			? data.uri
			: `${baseUrl}/${data.path}`;

	function handleViewAttachmentClick() {
		if (data.view_type === 'inline') {
			handleViewRawAttachment(data, baseUrl);
			return;
		}

		toast.error('No view type for text attachment');
	}

	function handleDownloadAttachmentClick() {
		if (!data.uri && !data.path) {
			toast.error('No path or uri to download');
			return;
		}

		handleDownloadAttachments(data.uri || data.path || '', baseUrl, {
			runId,
			resultId
		}).catch((error) => {
			console.error('Failed to download attachment:', error);
			toast.error('Failed to download attachment');
		});
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
							onClick={handleViewAttachmentClick}
							className="pl-2"
						>
							<Icon name="EyeShow" size={20} className="mr-2" />
							View
						</DropdownMenuItem>
					)}
					{data.download_enabled ? (
						<DropdownMenuItem
							onClick={handleDownloadAttachmentClick}
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

interface PacketCaptureAttachmentProps {
	data: GetLogAttachmentByType<'packet-capture'>;
	baseUrl: string;
	runId?: number;
	resultId?: number;
}

function PacketCaptureAttachment({
	data,
	baseUrl,
	runId,
	resultId
}: PacketCaptureAttachmentProps) {
	function getPacketViewerUrl(): string {
		const fileUrl = data.uri || (data.path ? `${baseUrl}/${data.path}` : '');
		const searchParams = new URLSearchParams();
		searchParams.set('fileUrl', fileUrl);

		if (runId && resultId) {
			searchParams.set('runId', runId.toString());
			searchParams.set('resultId', resultId.toString());
		}

		return `/tools/packet-viewer?${searchParams.toString()}`;
	}

	function handleDownloadAttachmentClick() {
		if (!data.uri && !data.path) {
			toast.error('No path or uri to download');
			return;
		}

		handleDownloadAttachments(data.uri || data.path || '', baseUrl, {
			runId,
			resultId
		}).catch((error) => {
			console.error('Failed to download packet capture:', error);
			toast.error('Failed to download packet capture');
		});
	}

	const viewerUrl = getPacketViewerUrl();
	const hasValidUrl = data.uri || data.path;

	return (
		<DropdownMenuSub>
			<DropdownMenuSubTrigger className="pl-2 text-xs">
				<div className="mr-2 flex items-center">
					<Icon name="Network" size={20} className="mr-2 scale-95" />
					{data.name}
				</div>
			</DropdownMenuSubTrigger>

			<DropdownMenuPortal>
				<DropdownMenuSubContent>
					{hasValidUrl &&
					data.view_type === 'bublik-tools/net-packet-analyzer' ? (
						<DropdownMenuItem asChild className="pl-2">
							<LinkWithProject to={viewerUrl} target="_blank">
								<Icon name="EyeShow" size={20} className="mr-2" />
								View
							</LinkWithProject>
						</DropdownMenuItem>
					) : (
						<DropdownMenuItem disabled className="pl-2">
							<Icon name="EyeShow" size={20} className="mr-2" />
							View
						</DropdownMenuItem>
					)}
					{data.download_enabled ? (
						<DropdownMenuItem
							onClick={handleDownloadAttachmentClick}
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

interface LogAttachmentsContainerProps {
	runId: number;
	focusId: number | null;
}

function LogAttachmentsContainer(props: LogAttachmentsContainerProps) {
	const { runId, focusId } = props;
	const { data, isLoading, error } = bublikAPI.useGetLogAttachmentsQuery(
		focusId ?? runId
	);

	const isDisabled = error || !data;
	const attachments = data?.data.attachments || [];

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
					Attachments
				</ButtonTw>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start" sideOffset={8}>
				<DropdownMenuLabel className="py-2 text-xs">
					Attachments
				</DropdownMenuLabel>
				<Separator className="h-px my-1" />

				{attachments.length === 0 ? (
					<DropdownMenuItem disabled>No attachments available</DropdownMenuItem>
				) : (
					attachments.map((attachment, idx) => {
						switch (attachment.type) {
							case 'text':
								return (
									<TextAttachment
										key={idx}
										data={attachment}
										baseUrl={data?.attachments_base_url ?? ''}
										runId={runId}
										resultId={focusId ?? undefined}
									/>
								);
							case 'packet-capture':
								return (
									<PacketCaptureAttachment
										key={idx}
										data={attachment}
										baseUrl={data?.attachments_base_url ?? ''}
										runId={runId}
										resultId={focusId ?? undefined}
									/>
								);
							default:
								return null;
						}
					})
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

export { LogAttachmentsContainer };
