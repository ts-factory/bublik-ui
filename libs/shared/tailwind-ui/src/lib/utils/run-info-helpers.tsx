/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { RUN_STATUS } from '@/shared/types';

import { Icon } from '../icon';

export const getRunStatusIcon = (runStatus: RUN_STATUS) => {
	switch (runStatus) {
		case RUN_STATUS.Warning:
			return <Icon name="InformationCircleExclamationMark" size={18} />;
		case RUN_STATUS.Ok:
			return <Icon name="InformationCircleCheckmark" size={18} />;
		case RUN_STATUS.Error:
			return <Icon name="InformationCircleCrossMark" size={18} />;
		case RUN_STATUS.Compromised:
			return <Icon name="InformationCircleStop" size={18} />;
		case RUN_STATUS.Interrupted:
			return <Icon name="InformationCircleStop" size={18} />;
		case RUN_STATUS.Running:
			return <Icon name="InformationCircleProgress" size={18} />;
		case RUN_STATUS.Busy:
			return <Icon name="InformationCircleForbidden" size={18} />;
		case RUN_STATUS.Stopped:
			return <Icon name="Clock" size={18} />;
		default:
			return <Icon name="InformationCircleExclamationMark" size={18} />;
	}
};

export const getRunStatusBgColor = (runStatus: RUN_STATUS): string => {
	switch (runStatus) {
		case RUN_STATUS.Warning:
			return 'bg-bg-warning';
		case RUN_STATUS.Ok:
			return 'bg-bg-ok';
		case RUN_STATUS.Error:
			return 'bg-bg-error';
		case RUN_STATUS.Compromised:
			return 'bg-bg-compromised';
		case RUN_STATUS.Interrupted:
			return 'bg-bg-interrupted';
		case RUN_STATUS.Running:
			return 'bg-bg-running';
		case RUN_STATUS.Busy:
			return 'bg-bg-busy';
		case RUN_STATUS.Stopped:
			return 'bg-bg-stopped';
		default:
			return 'bg-bg-primary';
	}
};

export const getRunStatusBgColorRaw = (runStatus: RUN_STATUS): string => {
	switch (runStatus) {
		case RUN_STATUS.Warning:
			return '#ff951c';
		case RUN_STATUS.Ok:
			return '#65cd84';
		case RUN_STATUS.Error:
			return '#f95c78';
		case RUN_STATUS.Compromised:
			return '#aeaeb9';
		case RUN_STATUS.Interrupted:
			return '#f0a0a6';
		case RUN_STATUS.Running:
			return '#7283e2';
		case RUN_STATUS.Busy:
			return '#ffd645';
		case RUN_STATUS.Stopped:
			return '#fadede';
		default:
			return '#ffffff';
	}
};

export const getRunStatusColor = (runStatus: RUN_STATUS): string => {
	switch (runStatus) {
		case RUN_STATUS.Busy:
			return 'text-text-unexpected';
		case RUN_STATUS.Stopped:
			return 'text-text-unexpected';
		default:
			return 'text-white';
	}
};

export const getLabelFromRunStatus = (runStatus: RUN_STATUS) => {
	return runStatus.split('-')[1];
};

export const getRunStatusInfo = (runStatus: RUN_STATUS) => {
	const icon = getRunStatusIcon(runStatus);
	const bg = getRunStatusBgColor(runStatus);
	const color = getRunStatusColor(runStatus);
	const label = getLabelFromRunStatus(runStatus);
	const bgRaw = getRunStatusBgColorRaw(runStatus);

	return { icon, bg, color, label, bgRaw } as const;
};
