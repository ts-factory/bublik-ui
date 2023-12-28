/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { DialogClose, Icon } from '@/shared/tailwind-ui';

import ChangelogMarkdown from '../changelog.mdx';
import styles from './changelog.module.scss';

export interface ChangelogContentProps {
	isDialog?: boolean;
}

export const ChangelogContent = (props: ChangelogContentProps) => {
	return (
		<div className="relative">
			{props.isDialog && (
				<DialogClose className="absolute top-0 right-0 p-1 rounded hover:bg-primary-wash text-text-menu hover:text-primary">
					<Icon name="Cross" />
				</DialogClose>
			)}
			<div className={styles['markdown-body']}>
				<ChangelogMarkdown />
			</div>
		</div>
	);
};
