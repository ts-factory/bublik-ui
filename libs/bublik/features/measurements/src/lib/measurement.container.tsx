/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useGetResultInfoQuery } from '@/services/bublik-api';
import { ScrollToTopPage } from '@/shared/tailwind-ui';

import { ModePicker } from './components';
import { useMeasurementTitle } from './measurement.hooks';
import { measurementsRoute, useMeasurementsMode } from './route';

export const MeasurementContainer = () => {
	const mode = useMeasurementsMode();
	const { runId, resultId } = measurementsRoute.useParams();
	const { data } = useGetResultInfoQuery(resultId);

	useMeasurementTitle({
		name: data?.name,
		start: data?.start,
		runId
	});

	return (
		<div data-testid="measurements-page" data-measurements-mode={mode}>
			<ModePicker mode={mode} />
			<ScrollToTopPage />
		</div>
	);
};
