/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useState } from 'react';
import { useHotkey } from '@tanstack/react-hotkeys';
import { linkOptions } from '@tanstack/react-router';

import { CopyShortUrlCommandItemContainer } from '@/bublik/features/copy-url';
import {
	useNavigateWithProject,
	useRouterNavigateWithProject
} from '@/bublik/features/projects';
import {
	Command,
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandSeparator,
	Icon
} from '@/shared/tailwind-ui';

/** The palette's targets, checked against the route tree. */
const PAGES = {
	dashboard: linkOptions({ to: '/dashboard' }),
	history: linkOptions({ to: '/history' }),
	runs: linkOptions({ to: '/runs' }),
	issues: linkOptions({ to: '/issues' }),
	faq: linkOptions({ to: '/help/faq' })
};

/**
 * The Mod+K command palette, rendered on the root route. Navigation goes
 * through the project-aware navigate, so the project scope and the sidebar
 * memory follow as they do from the sidebar links; the Profile item
 * navigates to the current pathname with only the settings keys, so the
 * page's own parameters are dropped on purpose.
 */
function BublikCommand() {
	const [open, setOpen] = useState(false);
	const navigate = useNavigateWithProject();
	// The Profile item stays on the current page with only the settings keys
	const navigateTo = useRouterNavigateWithProject();

	useHotkey('Mod+K', () => setOpen((open) => !open), {
		ignoreInputs: false,
		preventDefault: true,
		requireReset: true
	});

	function handleSelect(action: () => void) {
		return (_value: string) => {
			action();
			setOpen(false);
		};
	}

	return (
		<CommandDialog open={open} onOpenChange={setOpen}>
			<Command className="border rounded-lg shadow-xl">
				<CommandInput
					startIcon={
						<Icon name="MagnifyingGlass" className="size-5 text-text-menu" />
					}
					placeholder="Type a command or search..."
				/>
				<CommandList>
					<CommandEmpty>No results found.</CommandEmpty>
					<CommandGroup heading="Navigation">
						<CommandItem
							onSelect={handleSelect(() => navigate(PAGES.dashboard))}
						>
							<Icon name="Category" className="w-4 h-4 mr-2" />
							<span>Dashboard</span>
						</CommandItem>
						<CommandItem onSelect={handleSelect(() => navigate(PAGES.history))}>
							<Icon name="TimeCircle" className="w-4 h-4 mr-2" />
							<span>History</span>
						</CommandItem>
						<CommandItem onSelect={handleSelect(() => navigate(PAGES.runs))}>
							<Icon name="Play" className="w-4 h-4 mr-2" />
							<span>Runs</span>
						</CommandItem>
						<CommandItem onSelect={handleSelect(() => navigate(PAGES.issues))}>
							<Icon name="TriangleExclamationMark" className="w-4 h-4 mr-2" />
							<span>Issues</span>
						</CommandItem>
					</CommandGroup>
					<CommandSeparator />
					<CommandGroup heading="Settings">
						<CommandItem
							onSelect={handleSelect(() =>
								navigateTo({ search: '?settings-open=1&settings-tab=account' })
							)}
						>
							<Icon name="Profile" className="w-4 h-4 mr-2" />
							<span>Profile</span>
						</CommandItem>
						<CommandItem onSelect={handleSelect(() => navigate(PAGES.faq))}>
							<Icon name="Bulb" className="w-4 h-4 mr-2" />
							<span>Help</span>
						</CommandItem>
					</CommandGroup>
					<CommandGroup heading="Utils">
						<CopyShortUrlCommandItemContainer
							onComplete={() => setOpen(false)}
						/>
					</CommandGroup>
				</CommandList>
			</Command>
		</CommandDialog>
	);
}

export { BublikCommand };
