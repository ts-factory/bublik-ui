/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
	stories: [
		'../src/**/*.stories.@(js|jsx|ts|tsx|mdx)',
		'../../../libs/**/*.stories.@(js|jsx|ts|tsx|mdx)'
	],
	addons: [
		'@storybook/addon-essentials',
		'@storybook/addon-interactions',
		'@storybook/addon-a11y',
		'storybook-addon-react-router-v6'
	],
	framework: {
		name: '@storybook/react-vite',
		options: { builder: { viteConfigPath: './vite.config.ts' } }
	},
	staticDirs: ['./public'],
	docs: { autodocs: 'tag' }
};
export default config;

// To customize your Vite configuration you can use the viteFinal field.
// Check https://storybook.js.org/docs/react/builders/vite#configuration
// and https://nx.dev/packages/storybook/documents/custom-builder-configs
