/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { Icon } from '@/shared/tailwind-ui';

export const toolbarIcon = {
	expected: (
		<Icon
			name="InformationCircleCheckmark"
			size={16}
			className="ml-auto text-text-expected"
		/>
	),
	unexpected: (
		<Icon
			name="InformationCircleExclamationMark"
			size={16}
			className="ml-auto text-text-unexpected"
		/>
	),
	abnormal: (
		<Icon
			name="InformationCircleQuestionMark"
			size={16}
			className="ml-auto text-text-unexpected"
		/>
	)
} as const;
