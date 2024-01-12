/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { Outlet } from 'react-router-dom';

import { IframeToOldBublik } from '@/shared/tailwind-ui';
import { config } from '@/bublik/config';
import { useDocumentTitle } from '@/shared/hooks';

export const FlowerFeature = () => {
	useDocumentTitle('Flower - Bublik');

	return (
		<IframeToOldBublik
			title="flower-page"
			src={`${config.oldBaseUrl}/flower`}
			className="w-full h-screen"
		/>
	);
};

export const DevelopersLayout = () => {
	useDocumentTitle('Dev - Bublik');

	return <Outlet />;
};
