/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024 OKTET LTD */
import { useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from 'sonner';

import { useLazyGetShortUrlQuery } from '@/services/bublik-api';
import { CommandItem, Icon, SplitButton, Tooltip } from '@/shared/tailwind-ui';
import { useCopyToClipboard } from '@/shared/hooks';
import { config } from '@/bublik/config';

interface CopyShortUrlConfig {
	includeSearchParams?: boolean;
}

interface UseCopyShortUrlConfig {
	url: string;
}

function useCopyShortUrl(hookConfig: UseCopyShortUrlConfig) {
	const [getShortUrl] = useLazyGetShortUrlQuery();
	const [, copyText] = useCopyToClipboard();

	const copy = useCallback(
		async (copyConfig?: CopyShortUrlConfig) => {
			const { includeSearchParams = true } = copyConfig || {};

			try {
				const urlObj = new URL(hookConfig.url);
				if (!includeSearchParams) urlObj.search = '';
				const finalUrl = urlObj.toString();

				const promise = getShortUrl({ url: finalUrl });
				const { short_url } = await promise.unwrap();

				toast.promise(promise, {
					loading: 'Generating a short URL...',
					error: 'Could not copy the short URL. Please try again.',
					success: 'Short URL copied to clipboard successfully!'
				});

				copyText(short_url);
			} catch (_) {
				toast.error('Could not copy the short URL. Please try again.');
			}
		},
		[hookConfig.url, copyText, getShortUrl]
	);

	return { copyShortUrl: copy };
}

interface CopyShortUrlButtonContainerProps {
	variant?: 'header' | 'card';
}

function resolveFullUrl(location: ReturnType<typeof useLocation>) {
	return `${window.location.origin}${config.baseUrl}${location.pathname}${location.search}`;
}

function CopyShortUrlButtonContainer(props: CopyShortUrlButtonContainerProps) {
	const { variant = 'card' } = props;
	const location = useLocation();
	const { copyShortUrl } = useCopyShortUrl({ url: resolveFullUrl(location) });

	return (
		<SplitButton.Root
			variant={variant === 'card' ? 'secondary' : 'outline'}
			size={variant === 'card' ? 'xss' : 'md'}
		>
			<Tooltip content="Copy short URL to clipboard with page state">
				<SplitButton.Button
					onClick={() => copyShortUrl({ includeSearchParams: true })}
				>
					<Icon
						name="Upload"
						size={variant === 'card' ? 20 : 24}
						className={variant === 'card' ? '' : 'text-primary'}
					/>
				</SplitButton.Button>
			</Tooltip>
			<SplitButton.Separator orientation="vertical" className="h-5" />
			<SplitButton.Trigger className={variant === 'header' ? 'py-[10px]' : ''}>
				<Icon name="ArrowShortTop" size={18} className="rotate-180" />
			</SplitButton.Trigger>
			<SplitButton.Content className="z-50" align="end">
				<SplitButton.Label>Copy URL</SplitButton.Label>
				<SplitButton.Separator className="my-1" />
				<Tooltip
					content="Copy short URL to clipboard with page state"
					side="right"
					sideOffset={8}
				>
					<SplitButton.Item
						onClick={() => copyShortUrl({ includeSearchParams: true })}
					>
						<Icon name="PaperStack" size={20} className="text-primary" />
						<span>With Page State</span>
					</SplitButton.Item>
				</Tooltip>
				<Tooltip
					content="Copy short URL to clipboard without page state"
					side="right"
					sideOffset={8}
				>
					<SplitButton.Item
						onClick={() => copyShortUrl({ includeSearchParams: false })}
					>
						<Icon name="PaperStack" size={20} className="text-primary" />
						<span>Without Page State</span>
					</SplitButton.Item>
				</Tooltip>
			</SplitButton.Content>
		</SplitButton.Root>
	);
}

interface CopyShortUrlCommandItemContainerProps {
	onComplete?: () => void;
	includeSearchParams?: boolean;
}

function CopyShortUrlCommandItemContainer(
	props: CopyShortUrlCommandItemContainerProps
) {
	const { includeSearchParams = true, onComplete } = props;
	const location = useLocation();
	const { copyShortUrl } = useCopyShortUrl({ url: resolveFullUrl(location) });

	return (
		<CommandItem
			onSelect={() => {
				copyShortUrl({ includeSearchParams });
				onComplete?.();
			}}
		>
			<Icon name="Upload" className="w-4 h-4 mr-2" />
			<span>Copy Short URL</span>
		</CommandItem>
	);
}

export { CopyShortUrlButtonContainer, CopyShortUrlCommandItemContainer };
