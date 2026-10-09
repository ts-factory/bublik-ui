import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type {
	ClassifyMatcherOverride,
	ClassifyNewIssue,
	ClassifyScope,
	IssueCategory
} from '@/shared/types';
import {
	DEFAULT_MATCH_FLAGS,
	matcherForFlags
} from '../rule-form/match-scope.utils';
import { composeBugKey } from '../shared/bug-key.utils';
import { applyClassifyErrors } from './classify.utils';
import {
	ClassifyFormSchema,
	ClassifyFormValues,
	ClassifyForm
} from './classify-form.types';

export function useClassifyForm(): ClassifyForm {
	return useForm<ClassifyFormValues>({
		resolver: zodResolver(ClassifyFormSchema),
		defaultValues: {
			mode: 'new',
			title: '',
			tracker: '',
			bugKey: '',
			category: 'known-issue',
			scope: 'future',
			expected: 'none',
			...DEFAULT_MATCH_FLAGS
		}
	});
}

export function buildSubmitHandler(
	submit: (input: {
		issue: number | ClassifyNewIssue;
		category: IssueCategory;
		expected: boolean | null;
		scope: ClassifyScope;
		matcher?: ClassifyMatcherOverride;
	}) => Promise<unknown>,
	form: ClassifyForm,
	onDone: () => void
) {
	return async (values: ClassifyFormValues) => {
		const category = values.category as IssueCategory;
		const issue: number | ClassifyNewIssue =
			values.mode === 'existing' && values.issueId
				? values.issueId
				: {
						title: (values.title ?? '').trim(),
						// Null, never absent: the server requires the key to be present.
						bug_key: composeBugKey(values.tracker, values.bugKey) ?? null
				  };

		form.clearErrors('root');

		try {
			await submit({
				issue,
				category,
				expected:
					values.expected === 'expected'
						? true
						: values.expected === 'unexpected'
						? false
						: null,
				scope: values.scope as ClassifyScope,
				// Undefined when every dimension is on: that is the server's own
				// default capture, and sending an empty object would say nothing.
				matcher: matcherForFlags({
					matchParameters: values.matchParameters,
					matchVerdicts: values.matchVerdicts,
					matchTags: values.matchTags
				})
			});
		} catch (error: unknown) {
			applyClassifyErrors(error, form);
			return;
		}

		onDone();
	};
}
