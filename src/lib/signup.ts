import { isEmpty } from 'radashi';
import { toast } from 'svelte-sonner';
import { superForm } from 'sveltekit-superforms';

import * as m from '$lib/paraglide/messages';
import { setState } from '$lib/stores';
import { log } from '$lib/utils';

export const initForm = (data: Record<string, unknown>) => {
	const form = superForm(data, {
		dataType: 'json',
		id: 'signup',
		onError({ result }) {
			log.error('submission error', result.error.message);
			toast.error(result.error.message);
		},
		async onUpdate({ result }) {
			setState({ form: { hasErrors: false, success: false } });

			if (result.type === 'success') {
				setState({ form: { hasErrors: false, success: true } });
			} else {
				setState({ form: { hasErrors: true, success: false } });
				if (!isEmpty(result.data.form.errors)) log.error('form errors', result.data.form.errors);
				if (!isEmpty(result.data.form.error)) log.error('submission error', result.data.form.error);
				toast.error(m.signUpFailure);
			}
		}
	});

	return form;
};
