/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { FC, SyntheticEvent, useCallback, useMemo } from 'react';
import { FixedSizeNodePublicState } from 'react-vtree/dist/es';
import { NodeComponentProps } from 'react-vtree/dist/es/Tree';

import { NodeEntity } from '@/shared/types';

import { TreeData } from '../tree-view';
import { TreeItem } from '../tree-item';
import { useLogPage } from '../../../hooks';

export const Node: FC<
	NodeComponentProps<TreeData, FixedSizeNodePublicState<TreeData>>
> = ({
	data: { id, entity, nestingLevel, name, hasError, path, skipped },
	treeData: { mainPackage, focusId, currentScrollId, changeCurrentScrollId },
	isOpen,
	setOpen,
	style
}) => {
	const { isShowingRunLog, setFocusId } = useLogPage();
	const isFocused = id === focusId.toString();
	const isMainPackage = id === mainPackage;
	const isScrolled = currentScrollId.toString() === id;
	const isPackage =
		entity === NodeEntity.Package ||
		NodeEntity.Session ||
		entity === NodeEntity.Suite;
	const isTest = entity === NodeEntity.Test;
	const isSuite = entity === NodeEntity.Suite;

	const paddingStyle = useMemo(() => {
		return { paddingLeft: nestingLevel * 20 + (isTest ? 20 : 0) };
	}, [isTest, nestingLevel]);

	const styles = useMemo(() => style, [style]);

	const handleClick = useCallback(
		(e: SyntheticEvent<HTMLDivElement, MouseEvent>) => {
			e.preventDefault();

			if (!isScrolled) changeCurrentScrollId(id);
			if (!isSuite) setFocusId(id);
			if (!isMainPackage && isPackage) setOpen(!isOpen);
		},
		[
			changeCurrentScrollId,
			id,
			isMainPackage,
			isOpen,
			isPackage,
			isScrolled,
			isSuite,
			setFocusId,
			setOpen
		]
	);

	return (
		<TreeItem
			id={id}
			entity={entity}
			label={name}
			path={path}
			isOpen={isOpen}
			isFocused={isFocused}
			isScrolled={isScrolled}
			isShowingRunLog={isShowingRunLog}
			isRoot={isMainPackage}
			hasError={hasError}
			isSkipped={skipped}
			onClick={handleClick}
			paddingStyle={paddingStyle}
			style={styles}
		/>
	);
};
