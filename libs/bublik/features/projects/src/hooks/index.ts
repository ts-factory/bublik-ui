import { NumericArrayParam, useQueryParam } from 'use-query-params';

function useProjectSearch() {
	const [_projectIds = [], setProjectsIds] = useQueryParam(
		'project',
		NumericArrayParam
	);

	return {
		projectIds: ((_projectIds ?? []) as number[]).filter(Boolean),
		setProjectsIds
	};
}

export { useProjectSearch };
