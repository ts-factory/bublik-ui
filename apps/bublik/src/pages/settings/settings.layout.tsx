/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { PropsWithChildren, ReactNode } from 'react';
import { NavLink, To } from 'react-router-dom';

import { Icon, cn, ButtonTw } from '@/shared/tailwind-ui';
import { UserProfileInfoHeader } from '@/bublik/features/user-preferences';
import { useAuth, PrivateRouteLayoutOutlet } from '@/bublik/features/auth';

export const SettingsLayout = () => {
	const { user, logout } = useAuth();

	const handleLogoutClick = async () => {
		await logout();
	};

	if (!user) return null;

	return (
		<div className="h-screen p-2 overflow-hidden">
			<div className="flex h-full gap-1">
				<SettingsNavigationSidebar onLogoutClick={handleLogoutClick}>
					<UserProfileInfoHeader
						displayName={user.displayName}
						roles={user.roles}
					/>
				</SettingsNavigationSidebar>
				<div className="w-full h-full overflow-auto">
					<div className="flex-grow h-full px-4 py-5 bg-white rounded-md">
						<PrivateRouteLayoutOutlet />
					</div>
				</div>
			</div>
		</div>
	);
};

interface SettingsNavigationSidebarProps {
	onLogoutClick?: () => void;
}

const SettingsNavigationSidebar = (
	props: PropsWithChildren<SettingsNavigationSidebarProps>
) => {
	return (
		<aside className="flex flex-col flex-grow min-w-[240px] gap-4 p-4 bg-white rounded-md w-80">
			{props.children}
			<SettingsNavLink
				label="Profile"
				icon={<Icon name="Profile" size={24} />}
				to="/settings/profile"
			/>
			<SettingsNavLink
				label="Appearance"
				icon={<Icon name="Image" size={24} />}
				to="/settings/appearance"
			/>
			<ButtonTw
				variant={'destruction'}
				onClick={() => props.onLogoutClick?.()}
				className="mt-auto"
			>
				Sign out
			</ButtonTw>
		</aside>
	);
};

type SettingsNavLinkProps = {
	label: string;
	icon: ReactNode;
	to: To;
};

const SettingsNavLink = (props: SettingsNavLinkProps) => {
	const { label, icon, to } = props;

	return (
		<NavLink
			to={to}
			className={({ isActive }) =>
				cn(
					'flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-primary-wash hover:text-primary transition-colors text-text-menu text-md',
					isActive && 'bg-primary-wash text-primary'
				)
			}
		>
			{icon}
			{label}
		</NavLink>
	);
};
