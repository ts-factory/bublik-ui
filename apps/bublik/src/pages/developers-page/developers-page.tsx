/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { Outlet } from 'react-router-dom';

import { config } from '@/bublik/config';
import { IframeToOldBublik } from '@/shared/tailwind-ui';
import { useTabTitleWithPrefix } from '@/bublik/features/projects';

export const FlowerFeature = () => {
	useTabTitleWithPrefix('Flower - Bublik');

	return (
		<IframeToOldBublik
			title="flower-page"
			src={`${config.oldBaseUrl}/flower`}
			className="w-full h-screen"
		/>
	);
};

export const DevelopersLayout = () => {
	useTabTitleWithPrefix('Dev - Bublik');

	return <Outlet />;
};
