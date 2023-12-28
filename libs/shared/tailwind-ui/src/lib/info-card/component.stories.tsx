/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { Meta } from '@storybook/react';
import { InfoCard } from './component';

export default {
	component: InfoCard,
	title: 'components/Info Card'
} as Meta;

export const Primary = {
	args: {
		header: 'Something went wrong',
		message:
			'Lorem, ipsum dolor sit amet consectetur adipisicing elit. Eos et repellendus quos Maiores rerum vero ea. Dolore asperiores molestiae veritatis est cupiditate quibusdam iste animi voluptatem dolores hic? Aperiam, perferendis.'
	}
};
