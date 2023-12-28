/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { FaqFeature } from '@/bublik/features/faq';
import { DeployInfoContainer } from '@/bublik/features/deploy-info';

export const HelpPage = () => {
	return <FaqFeature deployInfo={<DeployInfoContainer />} />;
};
