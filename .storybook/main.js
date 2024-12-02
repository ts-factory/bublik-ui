/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
module.exports = {
	framework: {
		name: '@storybook/react-webpack5',
		options: {}
	},

	addons: [
		'@storybook/addon-mdx-gfm',
		'@storybook/addon-webpack5-compiler-babel',
		'@chromatic-com/storybook'
	],

	docs: {
		autodocs: true
	},

	typescript: {
		reactDocgen: 'react-docgen-typescript'
	}
}; // uncomment the property below if you want to apply some webpack config globally
// webpackFinal: async (config, { configType }) => {
//   // Make whatever fine-grained changes you need that should apply to all storybook configs
//   // Return the altered config
//   return config;
// },
