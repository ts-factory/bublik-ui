/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { Meta } from '@storybook/react';

import { CompromiseStatus } from './compromise-form';

export default {
	component: CompromiseStatus,
	title: 'run/Compromise Form',
	parameters: { layout: 'centered' },
	decorators: [
		(Story) => <div className="p-4 bg-white rounded-md">{Story()}</div>
	]
} as Meta<typeof CompromiseStatus>;

export const Primary = {
	args: {
		runDetails: {},
		tags: [
			{ value: 'L5', displayValue: 'Test bugzilla' },
			{ value: 'LOGS_BASE', displayValue: 'Sapi-TS logs' },
			{ value: 'OL', displayValue: 'Test bugzilla' }
		],
		initialValues: {
			bugId: '1',
			bugStorageKey: '2',
			comment: 'Test'
		},
		isCompromised: false,
		isError: false,
		isLoading: false
	}
};

export const Compromised = {
	args: {
		runDetails: {},
		tags: [
			{ value: 'L5', displayValue: 'Test bugzilla' },
			{ value: 'LOGS_BASE', displayValue: 'Test logs' },
			{ value: 'OL', displayValue: 'Test bugzilla' }
		],
		initialValues: {
			bugId: '1',
			bugStorageKey: '2',
			comment: 'Test'
		},
		isCompromised: true,
		isError: false,
		isLoading: false
	}
};

export const Loading = {
	args: {
		initialValues: { bugId: '', bugStorageKey: '', comment: '' },
		isCompromised: false,
		isError: false,
		isLoading: true
	}
};

export const Disabled = {
	args: {
		initialValues: { bugId: '', bugStorageKey: '', comment: '' },
		isCompromised: false,
		isError: true,
		isLoading: false
	}
};
