/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
/* eslint-disable */
export default {
	displayName: 'bublik',
	preset: '../../jest.preset.js',
	transform: {
		'^(?!.*\\.(js|jsx|ts|tsx|css|json)$)': '@nx/react/plugins/jest',
		'^.+\\.[tj]sx?$': 'babel-jest'
	},
	moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
	coverageDirectory: '../../coverage/apps/bublik'
};
