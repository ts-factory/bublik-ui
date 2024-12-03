/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
	stories: [
		'../src/**/*.@(mdx|stories.@(js|jsx|ts|tsx))',
		'../../../libs/**/*.@(mdx|stories.@(js|jsx|ts|tsx))'
	],

	addons: [
		'@storybook/addon-essentials',
		'@storybook/addon-interactions',
		'@storybook/addon-a11y',
		'storybook-addon-remix-react-router',
		'@chromatic-com/storybook'
	],

	framework: {
		name: '@storybook/react-vite',
		options: { builder: { viteConfigPath: './vite.config.ts' } }
	},

	staticDirs: ['./public'],
	docs: {},

	typescript: {
		reactDocgen: 'react-docgen-typescript'
	}
};
export default config;

// To customize your Vite configuration you can use the viteFinal field.
// Check https://storybook.js.org/docs/react/builders/vite#configuration
// and https://nx.dev/packages/storybook/documents/custom-builder-configs
