/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
/* eslint-disable */
export default {
	displayName: 'bublik-features-compromised-form',
	preset: '../../../../jest.preset.js',
	transform: {
		'^.+\\.[tj]sx?$': 'babel-jest'
	},
	moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
	coverageDirectory:
		'../../../../coverage/libs/bublik/features/compromised-form'
};
