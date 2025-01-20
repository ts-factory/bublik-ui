/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useMemo } from 'react';

import { Icon } from '@/shared/tailwind-ui';
import { config } from '@/bublik/config';
import {
	ButtonTw,
	cn,
	dialogContentStyles,
	DialogOverlay,
	dialogOverlayStyles,
	DialogPortal,
	Dialog,
	DialogTrigger,
	DialogContent,
	DialogTitle,
	Separator,
	Tabs,
	TabsList,
	TabsContent,
	TabsTrigger
} from '@/shared/tailwind-ui';

import { NavLink, SidebarItem } from '../nav-link';

const getNavSections = () => {
	const devSection: SidebarItem = {
		label: 'Admin',
		icon: <Icon name="Edit" />,
		to: '/admin/import',
		pattern: [{ path: '/admin/*' }],
		subitems: [
			{
				label: 'Configs',
				icon: <Icon name="SettingsSliders" size={20} />,
				to: '/admin/config',
				pattern: { path: '/admin/config' }
			},
			{
				label: 'Users',
				icon: <Icon name="TwoUsers" size={24} />,
				to: '/admin/users',
				pattern: { path: '/admin/users' }
			},
			{
				label: 'Performance',
				icon: <Icon name="TimeCircle" size={24} />,
				to: '/admin/performance',
				pattern: { path: '/admin/performance' }
			},
			{
				label: 'Import',
				icon: <Icon name="Import" size={24} />,
				to: '/admin/import',
				pattern: { path: '/admin/import' }
			},
			{
				label: 'Flower',
				icon: <Icon name="LineChartOnline" size={24} />,
				to: '/admin/flower',
				pattern: { path: '/admin/flower' }
			}
		]
	};

	const bottomNav: SidebarItem[] = [
		{
			label: 'Account',
			icon: <Icon name="Profile" size={28} />,
			to: '/settings/profile',
			pattern: { path: '/settings/*' }
		},
		{
			label: 'Help',
			icon: <Icon name="Bulb" size={28} />,
			to: '/help/faq',
			pattern: [{ path: '/help', end: false }, { path: '/help/faq' }],
			subitems: [
				{
					label: 'Documentation',
					icon: <Icon name="PaperText" />,
					href: `${config.oldBaseUrl}/docs`
				},
				{
					label: 'Changelog',
					icon: <Icon name="PaperChangelog" />,
					href: `${config.oldBaseUrl}/docs/blog`
				}
			]
		}
	];

	return [devSection, ...bottomNav];
};

export const BottomNavigation = () => {
	const links = useMemo(() => getNavSections(), []);

	return (
		<ul className="flex flex-col gap-3">
			{links.map((item) => (
				<li key={item.label}>
					<NavLink {...item} />
				</li>
			))}
			<SettingsModal />
		</ul>
	);
};

function SettingsModal() {
	return (
		<Dialog>
			<DialogTrigger asChild>
				<ButtonTw
					variant="outline"
					className="h-8 justify-start gap-2 rounded-lg px-[5px] shadow-none"
				>
					<Icon name="SettingsSliders" size={20} className="shrink-0" />
					<span className="truncate text-sm">Settings</span>
				</ButtonTw>
			</DialogTrigger>
			<DialogOverlay className={dialogOverlayStyles()} />
			<DialogPortal>
				<DialogContent
					className={cn(
						'h-[480px] w-[90vw] bg-white rounded-lg max-w-[900px] overflow-hidden p-0',
						dialogContentStyles()
					)}
				>
					<DialogTitle className="sr-only">Settings</DialogTitle>
					<Tabs
						className="grid grid-cols-[max(240px)_1fr] overflow-hidden h-full"
						orientation="vertical"
						defaultValue="account"
					>
						<TabsList className="flex flex-col gap-2 border-r px-2 py-4">
							<nav className="grid gap-2">
								<TabsTrigger value="account" variant="settings-tab">
									<Icon name="Profile" size={20} className="shrink-0" />
									<span>Account</span>
								</TabsTrigger>
								<TabsTrigger value="appearance" variant="settings-tab">
									<Icon name="AddSymbol" size={20} className="shrink-0" />
									<span>Appearance</span>
								</TabsTrigger>
								<TabsTrigger value="features" variant="settings-tab">
									{/* <FlaskConicalIcon className="size-5" /> */}
									<span>Beta Features</span>
								</TabsTrigger>
							</nav>
							<div className="mt-auto grid gap-2">
								<TabsTrigger value="version" variant="settings-tab">
									{/* <GitCommit className="size-5" /> */}
									<span>Version</span>
								</TabsTrigger>
							</div>
						</TabsList>

						<TabsContent value="account" className="overflow-auto">
							<SettingsContent
								header="Account"
								description="Manage your account settings."
							>
								<SettingsEmptyState />
							</SettingsContent>
						</TabsContent>
						{/* <TabsContent value="features" className="overflow-auto">
						<SettingsContent
							header="Beta Features"
							description="Enable or disable beta features."
						>
							<FeatureFlagSettings />
						</SettingsContent>
					</TabsContent> */}
						<TabsContent value="appearance" className="overflow-auto">
							<SettingsContent
								header="Appearance"
								description="Change the appearance."
							>
								<SettingsEmptyState />
							</SettingsContent>
						</TabsContent>
						{/* <TabsContent value="version" className="overflow-auto">
						<SettingsContent
							header="Version"
							description="Versions of the application components"
						>
							<SettingsVersionInformationContainer />
						</SettingsContent>
					</TabsContent> */}
					</Tabs>
				</DialogContent>
			</DialogPortal>
		</Dialog>
	);
}

interface SettingsContentProps {
	children: React.ReactNode;
	header: React.ReactNode;
	description: React.ReactNode;
}

function SettingsContent({
	children,
	header,
	description
}: SettingsContentProps) {
	return (
		<div className="flex flex-col gap-6 px-4 py-5">
			<div>
				<SettingsHeader>{header}</SettingsHeader>
				<SettingsDescription>{description}</SettingsDescription>
			</div>
			<Separator />
			{children}
		</div>
	);
}

function SettingsEmptyState() {
	return (
		<div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-slate-9 p-8">
			<Icon name="SettingsSliders" className="size-12" />
			<h3 className="text-xl font-bold">Settings not implemented yet</h3>
			<p className="text-muted-foreground">Please check back later.</p>
		</div>
	);
}

function SettingsDescription({ children }: { children: React.ReactNode }) {
	return <p className="text-muted-foreground">{children}</p>;
}

function SettingsHeader({ children }: { children: React.ReactNode }) {
	return <h2 className="text-xl font-bold">{children}</h2>;
}

export { SettingsModal };
