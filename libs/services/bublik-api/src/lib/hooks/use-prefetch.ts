/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useEffect } from 'react';
import { PrefetchOptions } from '@reduxjs/toolkit/dist/query/core/module';
import { useDispatch } from 'react-redux';

import { bublikAPI } from '../bublikAPI';

type EndpointNames = keyof typeof bublikAPI.endpoints;

export const usePrefetchImmediately = <T extends EndpointNames>(
	endpoint: T,
	arg: Parameters<(typeof bublikAPI.endpoints)[T]['initiate']>[0],
	options: PrefetchOptions = {}
) => {
	const dispatch = useDispatch();

	useEffect(() => {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		dispatch(bublikAPI.util.prefetch(endpoint, arg as any, options));
	}, []);
};
