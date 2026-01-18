import { ReactNode } from 'react';

export interface SettingsComingSoonProps {
	icon: ReactNode;
	title: string;
	description: string;
}

export function SettingsComingSoon({
	icon,
	title,
	description
}: SettingsComingSoonProps) {
	return (
		<div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-slate-6 bg-slate-1 p-10 text-center">
			{icon}
			<div className="space-y-1">
				<h3 className="text-base font-semibold text-text-primary">{title}</h3>
				<p className="text-sm text-text-menu max-w-sm">{description}</p>
			</div>
		</div>
	);
}
