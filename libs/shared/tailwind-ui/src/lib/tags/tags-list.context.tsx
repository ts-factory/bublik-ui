/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import {
	ComponentProps,
	PropsWithChildren,
	createContext,
	useContext
} from 'react';

import { UseTagListState } from './tags-list.hooks';

export type ITagsContext = UseTagListState;

const TagsContext = createContext<ITagsContext | null>(null);

export const useTagContext = () => {
	const api = useContext(TagsContext);

	if (!api) {
		throw new Error(
			'useTagContext must be used inside <TagsContextProvider />'
		);
	}

	return api;
};

export type TagsContextProviderProps = NonNullable<
	ComponentProps<typeof TagsContext.Provider>
>;

export const TagsContextProvider = ({
	children,
	...props
}: PropsWithChildren<TagsContextProviderProps>) => {
	return (
		<TagsContext.Provider value={props.value}>{children}</TagsContext.Provider>
	);
};
