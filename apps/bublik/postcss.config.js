/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
const { join } = require('path');

module.exports = {
	plugins: {
		tailwindcss: { config: join(__dirname, 'tailwind.config.js') },
		autoprefixer: {}
	}
};
