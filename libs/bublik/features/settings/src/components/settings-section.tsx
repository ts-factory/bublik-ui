import { ReactNode } from 'react';

export interface SettingsSectionProps {
	title: string;
	description?: string;
	/** Optional controls aligned with the heading, e.g. a "New token" button. */
	actions?: ReactNode;
	children: ReactNode;
}

export function SettingsSection({
	title,
	description,
	actions,
	children
}: SettingsSectionProps) {
	return (
		<div className="space-y-4">
			<div>
				<div className="flex items-start justify-between gap-4">
					<h3 className="text-base font-medium text-text-primary">{title}</h3>
					{actions}
				</div>
				{description && (
					<p className="text-sm text-text-menu mt-1 mb-2">{description}</p>
				)}
				<div className="border-b border-slate-2" />
			</div>
			{children}
		</div>
	);
}
