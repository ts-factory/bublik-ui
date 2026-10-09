import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type {
	ClassifyNewIssue,
	ClassifyScope,
	IssueCategory
} from '@/shared/types';
import {
	DEFAULT_SCOPE_PICKS,
	type ScopePicks
} from '../rule-form/match-scope.utils';
import { composeBugKey } from '../shared/bug-key.utils';
import { defaultDispositionFor } from '../shared/category.constants';
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
			// Undecided until someone decides: a mark to come back to, not a verdict.
			categories: ['to-investigate'],
			scope: 'future',
			expected: defaultDispositionFor('to-investigate'),
			picks: DEFAULT_SCOPE_PICKS
		}
	});
}

export function buildSubmitHandler(
	submit: (input: {
		issue: number | ClassifyNewIssue;
		categories: IssueCategory[];
		expected: boolean | null;
		scope: ClassifyScope;
		picks: ScopePicks;
	}) => Promise<unknown>,
	form: ClassifyForm,
	onDone: () => void
) {
	return async (values: ClassifyFormValues) => {
		const categories = values.categories as IssueCategory[];
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
				categories,
				expected:
					values.expected === 'expected'
						? true
						: values.expected === 'unexpected'
						? false
						: null,
				scope: values.scope as ClassifyScope,
				picks: values.picks
			});
		} catch (error: unknown) {
			applyClassifyErrors(error, form);
			return;
		}

		onDone();
	};
}
