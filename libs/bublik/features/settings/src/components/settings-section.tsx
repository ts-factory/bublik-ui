import { ReactNode } from 'react';

export interface SettingsSectionProps {
	title: string;
	description?: string;
	children: ReactNode;
}

export function SettingsSection({
	title,
	description,
	children
}: SettingsSectionProps) {
	return (
		<div className="space-y-4">
			<div>
				<h3 className="text-base font-medium text-text-primary">{title}</h3>
				{description && (
					<p className="text-sm text-text-menu mt-1 mb-2">{description}</p>
				)}
				<div className="border-b border-slate-2" />
			</div>
			{children}
		</div>
	);
}
