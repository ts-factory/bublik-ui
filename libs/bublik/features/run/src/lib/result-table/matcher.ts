export function calculateGroupSize(
	dataset: string[][],
	maxMismatchCount: number
) {
	const referenceSet = dataset[0];
	const referenceMap = new Map(
		Array.from(referenceSet, (item) => item.split('=')) as [string, string][]
	);

	let groupSize = 1;

	for (let i = 1; i < dataset.length; i++) {
		const currentSet = dataset[i];
		const currentSetMap = new Map(
			Array.from(currentSet, (item) => item.split('=')) as [string, string][]
		);

		let mismatchCount = 0;

		for (const [key, value] of referenceMap) {
			if (currentSetMap.get(key) !== value) {
				mismatchCount++;
				if (mismatchCount >= maxMismatchCount) {
					groupSize = i;
					return groupSize;
				}
			}
		}
	}

	return groupSize;
}

export type DiffValue = {
	value: string;
	isDifferent?: boolean;
};

export function highlightDifferences(
	current: string[],
	reference: string[],
	delimeter = '='
): DiffValue[] {
	const referenceMap = new Map<string, string>(
		Array.from(reference, (item) => item.split(delimeter)) as [string, string][]
	);

	return current.map((item) => {
		const currentKey = item.split(delimeter)?.[0];
		const currentValue = item.split(delimeter)?.[1];
		const referenceValue = referenceMap.get(currentKey);
		if (!referenceValue) return { value: item };
		if (currentValue !== referenceValue) {
			return { value: item, isDifferent: true };
		}
		return { value: item };
	});
}
