/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
const { createGlobPatternsForDependencies } = require('@nx/react/tailwind');
const { join } = require('path');

/** @type {import('tailwindcss').Config} */
module.exports = {
	presets: [require('./tailwind-bublik-preset')],
	content: [
		join(__dirname, './**/*!(*.stories|*.spec).{ts,tsx,html}'),
		join(__dirname, '../../libs/**/*!(*.stories|*.spec).{ts,tsx,html}'),
		...createGlobPatternsForDependencies(__dirname)
	],
	theme: { extend: {} },
	plugins: []
};
