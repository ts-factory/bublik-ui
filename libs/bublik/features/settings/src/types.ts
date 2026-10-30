import { ReactNode } from 'react';

export type SettingsTab =
	| 'account'
	| 'appearance'
	| 'tokens'
	| 'beta'
	| 'preferences';

export interface SettingsTabConfig {
	id: SettingsTab;
	label: string;
	icon: ReactNode;
	description: string;
}
