import { BooleanParam, useQueryParam, withDefault } from 'use-query-params';
import { Icon, ProfilePicture, toast, useSidebar } from '@/shared/tailwind-ui';
import {
	cn,
	dialogContentStyles,
	DialogOverlay,
	dialogOverlayStyles,
	DialogPortal,
	Dialog,
	DialogTrigger,
	DialogContent,
	DialogTitle,
	DialogClose
} from '@/shared/tailwind-ui';
import { useAuth } from '@/bublik/features/auth';
import { SETTINGS_TABS, VERSION_TAB } from './constants';
import type { SettingsTab } from './types';
import { SettingsContent } from './settings-content';
import { SettingsNavItem } from './components/settings-nav-item';

export function SettingsModal() {
	const [activeTab = 'account', setActiveTab] =
		useQueryParam<SettingsTab>('settings-tab');
	const [open, setOpen] = useQueryParam<boolean>(
		'settings-open',
		withDefault(BooleanParam, false)
	);
	const { user, logout } = useAuth();
	const { isSidebarOpen } = useSidebar();

	const handleLogout = async () => {
		await logout();
		toast.success('Signed out successfully');
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<button
					className={cn(
						'h-10 w-full justify-start gap-3 rounded-lg pr-2.5 text-text-menu shadow-none transition-all duration-200',
						'flex rounded-[0.625rem] items-center hover:text-primary transition-[margin-bottom] group relative',
						isSidebarOpen ? 'pl-4' : 'pl-2.5',
						open && 'bg-primary-wash text-primary'
					)}
				>
					<div className="size-7 grid place-items-center">
						<Icon name="SettingsSliders" size={24} className="shrink-0" />
					</div>
					<span className="truncate text-[1.125rem] font-medium">Settings</span>
				</button>
			</DialogTrigger>
			<DialogPortal>
				<DialogOverlay className={dialogOverlayStyles()} />
				<DialogContent
					className={cn(
						'h-[560px] lg:h-[640px] xl:h-[720px] w-[92vw] z-50 bg-white rounded-xl max-w-[860px] overflow-hidden p-0 shadow-2xl',
						dialogContentStyles()
					)}
				>
					<DialogTitle className="sr-only">Settings</DialogTitle>

					<div className="grid grid-cols-[220px_1fr] h-full">
						{/* Sidebar */}
						<div className="flex flex-col bg-slate-1 border-r border-slate-3">
							{/* User header */}
							{user && (
								<div className="px-6 pt-6 pb-6 border-b border-border-primary flex flex-col justify-center">
									<div className="flex items-center gap-3">
										<ProfilePicture
											displayName={user.displayName}
											className="w-9 h-9 text-xs"
										/>
										<div className="flex flex-col min-w-0">
											<span className="text-sm font-semibold text-text-primary truncate">
												{user.displayName}
											</span>
											<span className="text-xs text-text-menu truncate">
												{user.email}
											</span>
										</div>
									</div>
								</div>
							)}

							<nav className={cn('flex-1 p-2 space-y-0.5', !user && 'pt-8')}>
								{SETTINGS_TABS.map((tab) => (
									<SettingsNavItem
										key={tab.id}
										tab={tab}
										isActive={activeTab === tab.id}
										onClick={() => setActiveTab(tab.id)}
									/>
								))}
							</nav>

							<div className="p-2 border-t border-slate-3">
								<SettingsNavItem
									tab={VERSION_TAB}
									isActive={activeTab === 'version'}
									onClick={() => setActiveTab('version')}
								/>

								{user && (
									<button
										onClick={handleLogout}
										className="flex items-center gap-2.5 w-full px-3 py-2 text-sm font-medium text-text-unexpected rounded-md hover:bg-red-50 transition-colors"
									>
										<Icon name="BoxArrowRight" size={18} />
										<span>Sign out</span>
									</button>
								)}
							</div>
						</div>

						{/* Content */}
						<div className="flex flex-col overflow-hidden bg-white">
							{SettingsContent[activeTab] ?? null}
						</div>
					</div>

					<DialogClose className="absolute right-3 top-3 rounded-md p-1.5 text-text-menu hover:text-text-primary hover:bg-slate-2 transition-colors">
						<Icon name="CrossSimple" size={18} />
						<span className="sr-only">Close</span>
					</DialogClose>
				</DialogContent>
			</DialogPortal>
		</Dialog>
	);
}
