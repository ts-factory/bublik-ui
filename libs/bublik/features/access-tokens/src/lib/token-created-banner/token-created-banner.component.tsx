/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET Labs Ltd. */
import { ReactNode, useState } from 'react';
import { CircleCheck } from 'lucide-react';

import { config } from '@/bublik/config';
import { CreatedAccessToken } from '@/shared/types';
import { CodeBlock, CopyButton, Icon, cn } from '@/shared/tailwind-ui';

interface SnippetSectionProps {
	title: string;
	description: string;
	children: ReactNode;
}

const SnippetSection = ({
	title,
	description,
	children
}: SnippetSectionProps) => {
	return (
		<section className="flex flex-col min-w-0 gap-2">
			<div className="flex flex-col gap-0.5">
				<h4 className="text-[0.8125rem] font-semibold text-text-primary">
					{title}
				</h4>
				<p className="text-xs text-text-menu">{description}</p>
			</div>
			{children}
		</section>
	);
};

export interface TokenCreatedBannerProps {
	/**
	 * The token just created, value included. It exists here and nowhere
	 * else -- the server keeps only a hash -- so the banner stays until it is
	 * dismissed.
	 */
	token: CreatedAccessToken | null;
	onDismiss: () => void;
}

export const TokenCreatedBanner = ({
	token,
	onDismiss
}: TokenCreatedBannerProps) => {
	const [showSetup, setShowSetup] = useState(false);

	if (!token) return null;

	const origin = `${window.location.origin}${config.rootUrl}`;

	const mcpConfig = JSON.stringify(
		{
			mcpServers: {
				bublik: {
					type: 'http',
					url: `${origin}/mcp`,
					headers: { Authorization: `Bearer ${token.token}` }
				}
			}
		},
		null,
		2
	);

	const curlExample = `curl -H "Authorization: Bearer ${token.token}" \\\n  ${origin}/api/v2/auth/profile/info/`;

	return (
		<div
			role="status"
			className="flex flex-col gap-2.5 px-4 py-3.5 rounded-lg bg-badge-3"
			data-testid="access-token-created"
		>
			<div className="flex items-center gap-2 text-[0.8125rem] leading-5">
				<CircleCheck className="size-[18px] shrink-0 text-text-expected" />
				<p className="min-w-0 text-text-primary">
					<span className="font-semibold break-words">
						{token.name} created.
					</span>{' '}
					<span className="text-text-menu">
						Copy it now: it is stored only as a hash and won't be shown again.
					</span>
				</p>
				<button
					type="button"
					aria-label="Dismiss"
					onClick={onDismiss}
					className="grid ml-auto rounded-md size-7 shrink-0 place-items-center text-text-menu hover:bg-primary-wash hover:text-primary"
				>
					<Icon name="CrossSimple" size={16} />
				</button>
			</div>

			<div className="flex items-center gap-3 py-1.5 pl-3 pr-1.5 border rounded border-border-primary bg-bg-primary">
				<code
					className="flex-1 min-w-0 font-mono text-xs leading-5 break-all select-all text-text-primary"
					data-testid="access-token-value"
				>
					{token.token}
				</code>
				<CopyButton value={token.token} label="Copy token" />
			</div>

			<button
				type="button"
				aria-expanded={showSetup}
				onClick={() => setShowSetup((open) => !open)}
				className="flex items-center self-start gap-1 py-0.5 pl-0.5 pr-1.5 -ml-0.5 text-xs font-medium transition-colors rounded text-text-menu hover:bg-primary-wash hover:text-primary"
			>
				<Icon
					name="ArrowShortTop"
					size={16}
					className={cn(
						'transition-transform',
						showSetup ? 'rotate-180' : 'rotate-90'
					)}
				/>
				MCP client setup
			</button>
			{showSetup ? (
				<div className="flex flex-col gap-4 pb-1">
					<SnippetSection
						title="MCP client configuration"
						description="Point Claude Code, Codex or another MCP client at Bublik. Actions the agent takes are attributed to you."
					>
						<CodeBlock
							code={mcpConfig}
							language="json"
							title="json"
							copyLabel="Copy MCP configuration"
							data-testid="access-token-mcp-config"
						/>
					</SnippetSection>
					<SnippetSection
						title="REST API"
						description="The same token works against the API, for CI jobs and scripts."
					>
						<CodeBlock
							code={curlExample}
							language="bash"
							title="bash"
							copyLabel="Copy curl example"
							data-testid="access-token-curl-example"
						/>
					</SnippetSection>
				</div>
			) : null}
		</div>
	);
};
