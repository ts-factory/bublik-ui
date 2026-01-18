import { cn } from '@/shared/tailwind-ui';
import type { SettingsTabConfig } from '../types';

export interface SettingsNavItemProps {
	tab: SettingsTabConfig;
	isActive: boolean;
	onClick: () => void;
}

export function SettingsNavItem({
	tab,
	isActive,
	onClick
}: SettingsNavItemProps) {
	return (
		<button
			onClick={onClick}
			className={cn(
				'flex items-center gap-2.5 w-full px-3 py-2 text-sm font-medium rounded-md transition-all duration-150',
				isActive
					? 'bg-primary-wash text-primary'
					: 'text-text-menu hover:text-primary'
			)}
		>
			<span className="shrink-0">{tab.icon}</span>
			<span>{tab.label}</span>
		</button>
	);
}
