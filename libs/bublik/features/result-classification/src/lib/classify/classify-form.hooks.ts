import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { ClassifyScope, IssueCategory } from '@/shared/types';
import { DEFAULT_MATCH_FLAGS } from '../rule-form/match-scope.utils';
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
		issue: number | { title: string; bug_key?: string };
		category: IssueCategory;
		expected: boolean | null;
		scope: ClassifyScope;
		matcher: {
			matchParameters: boolean;
			matchVerdicts: boolean;
			matchImportantTags: boolean;
			matchAllTags: boolean;
		};
	}) => Promise<unknown>,
	form: ClassifyForm,
	onDone: () => void
) {
	return async (values: ClassifyFormValues) => {
		const category = values.category as IssueCategory;
		const issue =
			values.mode === 'existing' && values.issueId
				? values.issueId
				: {
						title: (values.title ?? '').trim(),
						bug_key: composeBugKey(values.tracker, values.bugKey)
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
				matcher: {
					matchParameters: values.matchParameters,
					matchVerdicts: values.matchVerdicts,
					matchImportantTags: values.matchImportantTags,
					matchAllTags: values.matchAllTags
				}
			});
		} catch (error: unknown) {
			applyClassifyErrors(error, form);
			return;
		}

		onDone();
	};
}
