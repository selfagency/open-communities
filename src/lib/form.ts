import { isEmpty } from 'radashi';
import { toast } from 'svelte-sonner';
import { superForm } from 'sveltekit-superforms';

import { goto } from '$app/navigation';
import * as m from '$lib/paraglide/messages';
import { setState } from '$lib/stores';

import { log } from './utils';

export const initForm = (formData: Record<string, unknown>, mode: string, isAdmin: boolean) => {
	const form = superForm(formData, {
		dataType: 'json',
		id: 'addEditCongregation',
		onError({ result }) {
			log.error(result.error.message);
			toast.error(result.error.message);
		},
		async onUpdate({ result }) {
			setState({ form: { hasErrors: false, success: false } });

			if (result.type === 'success') {
				toast.success(mode === 'edit' ? m.editSuccess() : m.addSuccess());
				if (isAdmin) {
					await goto('/', { invalidateAll: true });
				} else {
					setState({ form: { hasErrors: false, success: true } });
				}
			} else {
				setState({ form: { hasErrors: true, success: false } });
				form.errors.set(result.data.form.errors);
				if (!isEmpty(result.data.form.errors)) log.error('form errors', result.data.form.errors);
				if (!isEmpty(result.data.form.error)) log.error('submission error', result.data.form.error);
				toast.error(mode === 'edit' ? m.editFailure() : m.addFailure());
			}
		}
	});

	return form;
};
