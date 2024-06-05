/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024 OKTET LTD */
import { useCallback } from 'react';
import { toast } from 'sonner';

import { useLazyGetShortUrlQuery } from '@/services/bublik-api';
import { ButtonTw, Icon, Tooltip } from '@/shared/tailwind-ui';
import { useCopyToClipboard } from '@/shared/hooks';

interface UseCopyShortUrlConfig {
	url: string;
}

function useCopyShortUrl(config: UseCopyShortUrlConfig) {
	const [getShortUrl] = useLazyGetShortUrlQuery();
	const [, copyText] = useCopyToClipboard();

	const copy = useCallback(async () => {
		try {
			const promise = getShortUrl({ url: config.url });
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
	}, [config.url, copyText, getShortUrl]);

	return { copyShortUrl: copy };
}

interface CopyShortUrlButtonContainerProps {
	variant?: 'header' | 'card';
}

function CopyShortUrlButtonContainer({
	variant = 'card'
}: CopyShortUrlButtonContainerProps) {
	const { copyShortUrl } = useCopyShortUrl({ url: window.location.href });

	return (
		<Tooltip content="Copy short URL to clipboard">
			<ButtonTw
				variant={variant === 'card' ? 'secondary' : 'outline'}
				size={variant === 'card' ? 'xss' : 'md'}
				onClick={copyShortUrl}
			>
				<Icon
					name="Upload"
					size={variant === 'card' ? 20 : 24}
					className={variant === 'card' ? '' : 'text-primary'}
				/>
			</ButtonTw>
		</Tooltip>
	);
}

export { CopyShortUrlButtonContainer };
