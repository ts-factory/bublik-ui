import { ReactNode } from 'react';

export interface SettingsPaneProps {
	children: ReactNode;
	header: string;
	description: string;
}

export function SettingsPane({
	children,
	header,
	description
}: SettingsPaneProps) {
	return (
		<div className="flex flex-col h-full overflow-auto">
			<div className="sticky top-0 bg-white z-10 px-6 pt-5 pb-4 border-b border-slate-2">
				<h2 className="text-lg font-semibold text-text-primary">{header}</h2>
				<p className="text-sm text-text-menu">{description}</p>
			</div>
			<div className="flex-1 px-6 py-5 flex flex-col gap-8">{children}</div>
		</div>
	);
}
