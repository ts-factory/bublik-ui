/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET Labs Ltd. */
import { config } from '@/bublik/config';
import { useCopyToClipboard } from '@/shared/hooks';
import {
	ButtonTw,
	Dialog,
	DialogClose,
	DialogDescription,
	DialogPortal,
	DialogTitle,
	Icon,
	ModalContent,
	toast
} from '@/shared/tailwind-ui';

interface CopyableBlockProps {
	label: string;
	description: string;
	value: string;
	copyLabel: string;
}

const CopyableBlock = ({
	label,
	description,
	value,
	copyLabel
}: CopyableBlockProps) => {
	const [, copy] = useCopyToClipboard({
		onSuccess: () => toast.success(`${label} copied`)
	});

	return (
		<div className="flex flex-col gap-1.5">
			<div className="flex items-center justify-between">
				<span className="text-sm font-semibold text-text-primary">{label}</span>
				<ButtonTw
					variant="outline"
					size="xss"
					aria-label={copyLabel}
					onClick={() => copy(value)}
				>
					Copy
				</ButtonTw>
			</div>
			<p className="text-xs text-text-menu">{description}</p>
			<pre className="p-3 overflow-x-auto text-xs rounded-md bg-primary-wash text-text-primary">
				<code>{value}</code>
			</pre>
		</div>
	);
};

export interface TokenCreatedDialogProps {
	/**
	 * The token's value. It exists here and nowhere else -- the server keeps
	 * only a hash -- so the dialog is deliberately hard to dismiss by accident.
	 */
	token: string | null;
	onClose: () => void;
}

export const TokenCreatedDialog = ({
	token,
	onClose
}: TokenCreatedDialogProps) => {
	if (!token) return null;

	const origin = `${window.location.origin}${config.rootUrl}`;

	const mcpConfig = JSON.stringify(
		{
			mcpServers: {
				bublik: {
					type: 'http',
					url: `${origin}/mcp`,
					headers: { Authorization: `Bearer ${token}` }
				}
			}
		},
		null,
		2
	);

	const curlExample = `curl -H "Authorization: Bearer ${token}" \\\n  ${origin}/api/v2/auth/profile/info/`;

	return (
		<Dialog open onOpenChange={(open) => !open && onClose()}>
			{/*
			 * Portalled because this dialog opens from inside the settings
			 * modal, whose content carries a CSS transform -- that makes it the
			 * containing block for `position: fixed` descendants, so without a
			 * portal this dialog is positioned and clipped inside it.
			 */}
			<DialogPortal>
				<ModalContent
					/* Above the settings modal this opens from. */
					overlayClassName="z-[60]"
					className="w-full sm:max-w-2xl p-6 bg-white sm:rounded-lg md:shadow min-w-[420px] z-[70] relative overflow-auto max-h-[85vh]"
					/*
					 * Losing an unrecoverable secret to a stray click outside the
					 * dialog is the one mistake here that cannot be undone.
					 */
					onInteractOutside={(e) => e.preventDefault()}
					onEscapeKeyDown={(e) => e.preventDefault()}
				>
					<DialogTitle className="mb-1 text-2xl font-bold leading-tight tracking-tight text-text-primary">
						Your new access token
					</DialogTitle>

					<div className="flex items-start gap-2 p-3 my-4 rounded-md bg-bg-fillError">
						<Icon
							name="TriangleExclamationMark"
							size={18}
							className="text-text-unexpected shrink-0 mt-0.5"
						/>
						<DialogDescription className="text-sm text-text-unexpected">
							<span className="font-semibold">
								This is the only time this token will be shown.
							</span>{' '}
							Copy it now — it is stored only as a hash, so nobody, including an
							administrator, can show it to you again. If you lose it, revoke it
							and issue a new one.
						</DialogDescription>
					</div>

					<div className="flex flex-col gap-6">
						<CopyableBlock
							label="Token"
							description="Paste this into your client's configuration."
							value={token}
							copyLabel="Copy token"
						/>
						<CopyableBlock
							label="MCP client configuration"
							description="Point Claude Code, Codex or another MCP client at Bublik. Actions the agent takes are attributed to you."
							value={mcpConfig}
							copyLabel="Copy MCP configuration"
						/>
						<CopyableBlock
							label="REST API"
							description="The same token works against the API, for CI jobs and scripts."
							value={curlExample}
							copyLabel="Copy curl example"
						/>
					</div>

					<div className="flex justify-end mt-6">
						<DialogClose asChild>
							<ButtonTw variant="primary" size="md" onClick={onClose}>
								I've saved it
							</ButtonTw>
						</DialogClose>
					</div>
				</ModalContent>
			</DialogPortal>
		</Dialog>
	);
};
