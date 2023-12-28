/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { FC } from 'react';

import { useDocumentTitle } from '@/shared/hooks';
import { NotFound } from '@/shared/tailwind-ui';

export const NoMatchFeature: FC = () => {
	useDocumentTitle('Not Found - Bublik');

	return <NotFound />;
};
