/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import type { Meta } from '@storybook/react';

import {
	ChartsContainer,
	ChartsError,
	ChartsEmpty,
	ChartsLoading
} from './charts.container';

const Story: Meta<typeof ChartsContainer> = {
	component: ChartsContainer,
	title: 'measurements/Charts'
};
export default Story;

export const Primary = {
	args: {}
};

export const Loading = () => <ChartsLoading layout="mosaic" />;
export const Error = () => <ChartsError error={{ status: 404 }} />;
export const Empty = () => <ChartsEmpty />;
