/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useState } from 'react';
import { Meta } from '@storybook/react';

import { withBackground } from '../storybook-bg';
import { Checkbox, CheckboxProps } from './checkbox';

export default {
	component: Checkbox,
	title: 'form/Checkbox',
	decorators: [withBackground]
} as Meta;

export const Simple = () => {
	const [checked, setChecked] = useState<CheckboxProps['checked']>();

	return <Checkbox checked={checked} onCheckedChange={setChecked} />;
};

export const SimpleUnderminate = () => <Checkbox />;

export const Boxed = () => (
	<Checkbox iconName="Bin" iconSize={24} label="Checkbox" />
);
