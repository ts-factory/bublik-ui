/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import {
	InputHTMLAttributes,
	useCallback,
	useEffect,
	useMemo,
	useState
} from 'react';
import { TagModel } from './tags-list.types';

export type UseTagListConfig = {
	tags: TagModel[];
};

export type UseTagListState = {
	tags: TagModel[];
	selectedTags: TagModel[];
	addTag: (tag: TagModel) => void;
	removeTag: (tag: TagModel) => void;
	toggleTag: (tag: TagModel) => void;
	selectTag: (tag: TagModel) => void;
	unselectTag: (tag: TagModel) => void;
	removeLastTag: () => TagModel | undefined;
	changeTag: (tag: TagModel) => void;
	tagDrop: (active: TagModel, drop: TagModel) => void;
};

export const useTagListState = (config: UseTagListConfig): UseTagListState => {
	const { tags: initialTags } = config;

	const [tags, setTags] = useState<TagModel[]>(initialTags);

	const addTag = useCallback((tag: TagModel) => {
		console.log('ADD TAG:', tag);
		setTags((tags) => [...tags, tag]);
	}, []);

	const removeTag = useCallback((tag: TagModel) => {
		console.log('REMOVE TAG:', tag);
		setTags((tags) => tags.filter((t) => t.id !== tag.id));
	}, []);

	const selectTag = useCallback((tag: TagModel) => {
		console.log('SELECT TAG:', tag);
		setTags((tags) =>
			tags.map((t) => (t.id === tag.id ? { ...t, isSelected: true } : t))
		);
	}, []);

	const unselectTag = useCallback((tag: TagModel) => {
		console.log('UNSELECT TAG:', tag);
		setTags((tags) =>
			tags.map((t) => (t.id === tag.id ? { ...t, isSelected: false } : t))
		);
	}, []);

	const toggleTag = useCallback((tag: TagModel) => {
		console.log('TOGGLE TAG:', tag);
		setTags((tags) =>
			tags.map((t) =>
				t.id === tag.id ? { ...t, isSelected: !t.isSelected } : t
			)
		);
	}, []);

	const changeTag = useCallback((tag: TagModel) => {
		console.log('CHANGE TAG:', tag);
		setTags((tags) => tags.map((t) => (t.id === tag.id ? tag : t)));
	}, []);

	const removeLastTag = useCallback(() => {
		const lastTag = tags.at(-1);

		setTags((tags) => {
			return tags.filter((tag, idx, arr) =>
				idx === arr.length - 1 ? false : true
			);
		});

		return lastTag;
	}, [tags]);

	const selectedTags = useMemo(
		() => tags.filter((tag) => tag.isSelected),
		[tags]
	);

	const tagDrop = useCallback((active: TagModel, over: TagModel) => {
		setTags((tags) => {
			const withoutActive = tags.filter((t) => t.id !== active.id);

			const result = withoutActive.map((t) =>
				t.id === over.id
					? {
							...t,
							label: `${active.value}&${t.value}`,
							value: `${active.value}&${t.value}`
					  }
					: t
			);

			return result;
		});
	}, []);

	return {
		selectedTags,
		tags,
		addTag,
		removeTag,
		selectTag,
		unselectTag,
		toggleTag,
		removeLastTag,
		changeTag,
		tagDrop
	};
};

export const useTagInputProps = (
	state: UseTagListState
): InputHTMLAttributes<HTMLInputElement> => {
	const [value, setValue] = useState('');

	const handleBackspace = useCallback(
		(e: KeyboardEvent) => {
			if (e.key !== 'Backspace' || value !== '') return;
			e.preventDefault();

			const tag = state.removeLastTag();

			if (tag) setValue(tag.value);
		},
		[state, value]
	);

	useEffect(() => {
		document.addEventListener('keydown', handleBackspace);
		return () => document.removeEventListener('keydown', handleBackspace);
	}, [handleBackspace]);

	return {
		value,
		onChange: (e) => setValue(e.target.value)
	};
};
