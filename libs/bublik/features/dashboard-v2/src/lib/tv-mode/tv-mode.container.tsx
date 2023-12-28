/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import {
	ButtonTw,
	Dialog,
	DialogContent,
	DialogTrigger,
	Icon,
	Tooltip,
	toast
} from '@/shared/tailwind-ui';

import { useDashboardReload, useDashboardTvMode } from '../hooks';
import { LayoutHandlerContainer } from '../layout-handler';

export const TvModeContainer = () => {
	const { setIsEnabled } = useDashboardReload();
	const { setIsTvModeEnabled, isTvModeEnabled } = useDashboardTvMode();

	const handleOpenChange = (open: boolean) => {
		if (open) {
			setIsEnabled(true);
			toast.info('To leave TV mode press ESC', {
				position: 'top-center',
				className: 'pointer-events-none'
			});
		} else {
			setIsEnabled(false);
		}

		setIsTvModeEnabled(open);
	};

	return (
		<Dialog open={isTvModeEnabled} onOpenChange={handleOpenChange} modal>
			<Tooltip content="Enable TV mode">
				<DialogTrigger asChild>
					<ButtonTw variant="outline">
						<Icon name="Image" size={22} className="mr-2 text-primary" />
						TV
					</ButtonTw>
				</DialogTrigger>
			</Tooltip>
			<DialogContent
				onOpenAutoFocus={(e) => e.preventDefault()}
				className="fixed top-0 left-0 z-50 w-full h-full p-2 overflow-auto bg-bg-body focus:outline-none"
			>
				<LayoutHandlerContainer />
			</DialogContent>
		</Dialog>
	);
};
