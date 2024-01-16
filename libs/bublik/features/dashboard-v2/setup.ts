/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { afterEach, expect } from 'vitest';
import { cleanup } from '@testing-library/react';
import matchers from '@testing-library/jest-dom/matchers';
import '@testing-library/jest-dom/extend-expect';

expect.extend(matchers);
afterEach(() => {
	cleanup();
});

export const setup = () => {
	process.env.TZ = 'UTC';
};
