/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { StoryFn, Meta } from '@storybook/react';

import { runDetailsMock } from './run-details.mock';
import {
	RunDetails,
	RunDetailsEmpty,
	RunDetailsError,
	RunDetailsLoading,
	RunDetailsProps
} from './run-details.component';
import { RUN_STATUS } from '@/shared/types';
import { withBackground } from '@/shared/tailwind-ui';

export default {
	component: RunDetails,
	title: 'run/Run Details',
	parameters: { layout: 'padded' },
	decorators: [withBackground]
} as Meta;

export const Primary = {
	args: {
		isFullMode: false,
		runStatus: RUN_STATUS.Ok,
		status: 'ok',
		statusByNok: 'ok',
		runId: runDetailsMock.id,
		mainPackage: runDetailsMock.name,
		start: runDetailsMock.start,
		finish: runDetailsMock.finish,
		duration: runDetailsMock.duration,
		isCompromised: runDetailsMock.is_compromised,
		importantTags: runDetailsMock.important_tags,
		relevantTags: runDetailsMock.relevant_tags,
		revisions: runDetailsMock.revisions,
		branches: runDetailsMock.branches,
		labels: runDetailsMock.labels,
		specialCategories: runDetailsMock.special_categories
	}
};

export const Loading = () => <RunDetailsLoading />;
export const Error = () => <RunDetailsError error={{ status: 400 }} />;
export const Empty = () => <RunDetailsEmpty />;
