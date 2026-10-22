/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import ReactJson, { ReactJsonViewProps, ThemeObject } from 'react-json-view';

import { useTheme } from '@/shared/hooks';

// react-json-view's own default is light only: near-black keys and braces and
// a light indent guide. This keeps its colour roles on a dark surface.
const DARK_THEME: ThemeObject = {
	base00: 'transparent', // background
	base01: '#262626', // edit and add backgrounds
	base02: '#2e2e2e', // indent guide, null background
	base03: '#737373',
	base04: 'rgba(255, 255, 255, 0.4)', // item counts
	base05: '#a1a1a1',
	base06: '#d4d4d4',
	base07: '#e5e5e5', // keys, braces
	base08: '#f472b6',
	base09: '#fb923c', // strings
	base0A: '#f87171', // null, undefined
	base0B: '#a3e635', // floats
	base0C: '#a78bfa', // array indices
	base0D: '#a1a1a1', // expanded icon
	base0E: '#2dd4bf', // booleans, collapsed icon
	base0F: '#60a5fa' // integers
};

export type JsonViewerProps = Pick<
	ReactJsonViewProps,
	'collapsed' | 'src' | 'displayDataTypes'
>;

export const JsonViewer = (props: JsonViewerProps) => {
	const { resolvedTheme } = useTheme();

	return (
		<ReactJson
			iconStyle="square"
			displayDataTypes={false}
			collapsed={1}
			theme={resolvedTheme === 'dark' ? DARK_THEME : 'rjv-default'}
			{...props}
		/>
	);
};
