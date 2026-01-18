import { ReactNode } from 'react';

export type SettingsTab =
	| 'account'
	| 'appearance'
	| 'beta'
	| 'preferences'
	| 'version';

export interface SettingsTabConfig {
	id: SettingsTab;
	label: string;
	icon: ReactNode;
	description: string;
}
