import { ComponentPropsWithRef, forwardRef, Ref, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { useProjectSearch } from '../hooks';
import {
	mergeParamsWithSidebarState,
	mergeStringUrlWithSidebarState
} from '../lib/sidebar-params.utils';

export type LinkWithProjectProps = ComponentPropsWithRef<typeof Link>;

function getToFromString(
	to: string,
	currentSearchParams: URLSearchParams,
	projectIds: number[]
): string {
	return mergeStringUrlWithSidebarState(to, currentSearchParams, projectIds);
}

function LinkWithProjectImpl(
	{ to, children, ...props }: LinkWithProjectProps,
	ref: Ref<HTMLAnchorElement>
) {
	const { projectIds } = useProjectSearch();
	const [currentSearchParams] = useSearchParams();

	const finalTo = useMemo(() => {
		if (typeof to === 'string') {
			return getToFromString(to, currentSearchParams, projectIds);
		}

		const targetParams = new URLSearchParams(to.search || '');
		const mergedParams = mergeParamsWithSidebarState(
			targetParams,
			currentSearchParams,
			projectIds
		);

		return {
			pathname: to.pathname,
			search: mergedParams.toString(),
			hash: to.hash
		};
	}, [to, currentSearchParams, projectIds]);

	return (
		<Link to={finalTo} {...props} ref={ref}>
			{children}
		</Link>
	);
}

const LinkWithProject = forwardRef(LinkWithProjectImpl);

export { LinkWithProject };
