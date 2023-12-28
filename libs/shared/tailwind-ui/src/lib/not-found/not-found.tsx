/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { Link, useNavigate } from 'react-router-dom';

import { ButtonTw } from '../button';
import { ErrorPage } from '../error-page';

export const NotFound = () => {
	const navigate = useNavigate();

	return (
		<ErrorPage
			label="404"
			message={
				<>
					Sorry, Page not found <br />
					The page you requested could not be found
				</>
			}
			actions={
				<>
					<ButtonTw
						variant="primary"
						size="md"
						rounded="lg"
						onClick={() => navigate(-1)}
						className="w-full py-2.5"
					>
						<span className="text-[14px] font-semibold leading-[18px]">
							Go back
						</span>
					</ButtonTw>
					<ButtonTw
						variant={'outline'}
						size={'md'}
						rounded={'lg'}
						asChild
						className={'w-full'}
					>
						<Link to="/dashboard">Go to dashboard</Link>
					</ButtonTw>
				</>
			}
		/>
	);
};
