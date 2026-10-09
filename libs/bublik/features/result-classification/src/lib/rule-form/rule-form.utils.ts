import { listToItems, parametersToItems } from './matcher-fields.utils';
import { defaultDispositionFor } from '../shared/category.constants';
import { RuleFormValues, RuleFormSeed } from './rule-form.types';

export function expectedToKey(
	expected: boolean | null | undefined
): RuleFormValues['expected'] {
	if (expected === true) return 'expected';
	if (expected === false) return 'unexpected';

	return 'none';
}

export function keyToExpected(key: RuleFormValues['expected']): boolean | null {
	if (key === 'expected') return true;
	if (key === 'unexpected') return false;

	return null;
}

export function ruleToFormValues({
	rule,
	projectId,
	issueId,
	testId
}: RuleFormSeed): RuleFormValues {
	const category = rule?.category ?? 'known-issue';

	return {
		project: rule?.project ?? projectId ?? 0,
		issue: rule?.issue ?? issueId ?? 0,
		test: rule?.test ?? testId ?? 0,
		category,
		expected: rule
			? expectedToKey(rule.expected)
			: defaultDispositionFor(category),
		active: rule?.active === false ? 'inactive' : 'active',
		parameters: parametersToItems(rule?.parameters),
		verdicts: listToItems(rule?.verdicts),
		tags: listToItems(rule?.tags)
	};
}
