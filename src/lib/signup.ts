import { isEmpty } from 'radashi';
import { toast } from 'svelte-sonner';
import { superForm } from 'sveltekit-superforms';

import { m } from '$lib/paraglide/messages';
import { setState } from '$lib/stores';
import { log } from '$lib/utils';

export const initForm = (data: Record<string, unknown>) => {
	const form = superForm(data, {
		dataType: 'json',
		id: 'signup',
		onError({ result }) {
			log.error('submission error', result.error.message);
			toast.error(m.signUpFailure);
		},
		onResult() {
			setState({ loading: false });
		},
		onSubmit() {
			setState({ loading: true });
		},
		async onUpdate({ result }) {
			setState({ form: { hasErrors: false, success: false }, loading: false });

			if (result.type === 'success') {
				setState({ form: { hasErrors: false, success: true } });
			} else {
				setState({ form: { hasErrors: true, success: false } });
				if (!isEmpty(result.data.form.errors)) {
					log.error('form errors', result.data.form.errors);
				}
				toast.error(m.signUpFailure);
			}
		}
	});

	return form;
};
