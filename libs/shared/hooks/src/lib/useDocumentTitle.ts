/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useEffect } from 'react';

export const useDocumentTitle = (title: string) => {
	useEffect(() => {
		document.title = title;
	}, [title]);
};
