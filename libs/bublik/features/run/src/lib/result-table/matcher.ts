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

type DiffValue = {
	value: string;
	isDifferent?: boolean;
};

export function highlightDifferences(
	dataset: string[][],
	referenceSet: string[]
): DiffValue[][] {
	const PARAMETER_DELIMITER = '=';

	const highlightedDataset = [];

	const referenceMap = new Map<string, string>(
		Array.from(referenceSet, (item) => item.split(PARAMETER_DELIMITER)) as [
			string,
			string
		][]
	);

	for (let i = 0; i < dataset.length; i++) {
		const currentSet = dataset[i];
		const currentSetMap = new Map<string, string>(
			Array.from(currentSet, (item) => item.split(PARAMETER_DELIMITER)) as [
				string,
				string
			][]
		);
		const highlightedSet: DiffValue[] = [];

		for (let j = 0; j < referenceSet.length; j++) {
			const referenceKeyValue = referenceSet[j].split(PARAMETER_DELIMITER);
			const currentKeyValue = currentSet[j].split(PARAMETER_DELIMITER);

			if (
				referenceMap.get(referenceKeyValue[0]) !==
				currentSetMap.get(currentKeyValue[0])
			) {
				highlightedSet.push({ value: currentSet[j], isDifferent: true });
			} else {
				highlightedSet.push({ value: currentSet[j] });
			}
		}

		highlightedDataset.push(highlightedSet);
	}

	return highlightedDataset;
}
