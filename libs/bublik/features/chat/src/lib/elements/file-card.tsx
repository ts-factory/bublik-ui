/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { MouseEvent, useState } from 'react';
import {
	DownloadIcon,
	FileIcon,
	FileSpreadsheetIcon,
	FileTextIcon,
	LoaderCircleIcon
} from 'lucide-react';

import { config } from '@/bublik/config';
import { cn, toast } from '@/shared/tailwind-ui';

/** Metadata returned by the backend `generate_file` tool. */
export interface GeneratedFile {
	file_id: string;
	filename: string;
	content_type: string;
	size: number;
	download_url: string;
}

/**
 * Extract a GeneratedFile from a `generate_file` tool output. The output may
 * arrive as an object or as a JSON string depending on how the run was
 * transported/persisted, so parse defensively; anything unexpected yields
 * null and the caller falls back to the generic tool card.
 */
export function parseGeneratedFile(output: unknown): GeneratedFile | null {
	let value = output;
	if (typeof value === 'string') {
		try {
			value = JSON.parse(value);
		} catch {
			return null;
		}
	}
	if (typeof value !== 'object' || value === null) return null;
	const candidate = value as Record<string, unknown>;
	if (
		typeof candidate['file_id'] !== 'string' ||
		typeof candidate['filename'] !== 'string' ||
		typeof candidate['download_url'] !== 'string'
	) {
		return null;
	}
	return {
		file_id: candidate['file_id'],
		filename: candidate['filename'],
		content_type:
			typeof candidate['content_type'] === 'string'
				? candidate['content_type']
				: 'application/octet-stream',
		size: typeof candidate['size'] === 'number' ? candidate['size'] : 0,
		download_url: toSameOrigin(candidate['download_url'])
	};
}

/**
 * Force download URLs onto the current origin. Older runs persisted absolute
 * FQDN-based URLs; if the user browses via a different host (localhost vs
 * 127.0.0.1) those are cross-origin, so the SameSite=Strict auth cookie is
 * not sent and the download 401s.
 */
function toSameOrigin(url: string): string {
	if (url.startsWith('/')) return url;
	try {
		const parsed = new URL(url);
		return `${parsed.pathname}${parsed.search}`;
	} catch {
		return url;
	}
}

function formatSize(bytes: number): string {
	if (!bytes) return '';
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileTypeIcon({ contentType }: { contentType: string }) {
	if (contentType.includes('spreadsheet') || contentType === 'text/csv') {
		return <FileSpreadsheetIcon className="size-4 text-text-menu" />;
	}
	if (
		contentType === 'application/pdf' ||
		contentType.includes('wordprocessing') ||
		contentType.startsWith('text/')
	) {
		return <FileTextIcon className="size-4 text-text-menu" />;
	}
	return <FileIcon className="size-4 text-text-menu" />;
}

/**
 * Fetch the file with the auth cookie, refreshing the access token once on
 * an auth failure — the same recovery the RTK baseQueryWithAuth performs.
 * A plain <a> navigation would bypass that layer, so an expired 15-minute
 * access token would surface as a 401 JSON page.
 */
async function fetchFileWithRefresh(url: string): Promise<Response> {
	let response = await fetch(url, { credentials: 'include' });
	if (response.status === 401 || response.status === 403) {
		const refresh = await fetch(`${config.rootUrl}/auth/refresh/`, {
			method: 'POST',
			credentials: 'include'
		});
		if (refresh.ok) {
			response = await fetch(url, { credentials: 'include' });
		}
	}
	return response;
}

async function downloadFile(file: GeneratedFile): Promise<void> {
	const response = await fetchFileWithRefresh(file.download_url);
	if (!response.ok) {
		throw new Error(`Download failed (${response.status})`);
	}
	const blob = await response.blob();
	const objectUrl = URL.createObjectURL(blob);
	const anchor = document.createElement('a');
	anchor.href = objectUrl;
	anchor.download = file.filename;
	document.body.appendChild(anchor);
	anchor.click();
	anchor.remove();
	URL.revokeObjectURL(objectUrl);
}

/**
 * Download card for an agent-generated file. The link is same-origin, so the
 * browser sends the auth cookie and the backend enforces thread ownership.
 */
export function FileCard({
	file,
	className
}: {
	file: GeneratedFile;
	className?: string;
}) {
	const [isDownloading, setIsDownloading] = useState(false);
	const size = formatSize(file.size);

	async function handleDownload(e: MouseEvent<HTMLAnchorElement>) {
		e.preventDefault();
		if (isDownloading) return;
		setIsDownloading(true);
		try {
			await downloadFile(file);
		} catch {
			toast.error(`Failed to download ${file.filename}`);
		} finally {
			setIsDownloading(false);
		}
	}

	return (
		<div
			className={cn(
				'flex items-center gap-2 rounded-md border border-border-primary bg-white/70 px-2 py-1.5',
				className
			)}
		>
			<FileTypeIcon contentType={file.content_type} />
			<div className="min-w-0 flex-1">
				<div className="truncate text-[0.75rem] font-medium text-text-primary">
					{file.filename}
				</div>
				{size ? (
					<div className="text-[0.6875rem] text-text-secondary">{size}</div>
				) : null}
			</div>
			<a
				href={file.download_url}
				download={file.filename}
				onClick={handleDownload}
				aria-disabled={isDownloading}
				className="flex items-center gap-1 rounded border border-border-primary px-2 py-1 text-[0.6875rem] font-medium text-text-primary hover:bg-primary-wash"
			>
				{isDownloading ? (
					<LoaderCircleIcon className="size-3.5 animate-spin" />
				) : (
					<DownloadIcon className="size-3.5" />
				)}
				Download
			</a>
		</div>
	);
}
