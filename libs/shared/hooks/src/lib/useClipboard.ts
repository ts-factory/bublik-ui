/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useCallback, useState } from 'react';
import clipboardCopy from 'clipboard-copy';

type CopiedValue = string | null;
type CopyFn = (text: string) => Promise<boolean>;

export interface UseCopyToClipboardConfig {
	onError?: (error: unknown) => void;
	onSuccess?: (copiedText: string) => void;
}

export type CopyToClipboardHook = (
	config?: UseCopyToClipboardConfig
) => [CopiedValue, CopyFn];

export const useCopyToClipboard: CopyToClipboardHook = (config = {}) => {
	const { onSuccess, onError } = config;
	const [copiedText, setCopiedText] = useState<CopiedValue>(null);

	const copy: CopyFn = useCallback(
		async (text) => {
			try {
				await clipboardCopy(text);
				setCopiedText(text);
				onSuccess?.(text);
				return true;
			} catch (error) {
				console.warn('Copy failed', error);
				setCopiedText(null);
				onError?.(error);
				return false;
			}
		},
		[onError, onSuccess]
	);

	return [copiedText, copy];
};
