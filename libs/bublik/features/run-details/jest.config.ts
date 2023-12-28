/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
/* eslint-disable */
export default {
	displayName: 'bublik-features-run-details',
	preset: '../../../../jest.preset.js',
	transform: {
		'^(?!.*\\.(js|jsx|ts|tsx|css|json)$)': '@nx/react/plugins/jest',
		'^.+\\.[tj]sx?$': ['babel-jest', { presets: ['@nx/react/babel'] }]
	},
	moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
	coverageDirectory: '../../../../coverage/libs/bublik/features/run-details'
};
