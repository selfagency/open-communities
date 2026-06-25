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
      // This handles actual server errors (500s, exceptions, etc.)
      log.error('submission error', result.error.message);
      toast.error(m.signUpFailure());
    },
    onResult() {
      setState({ loadingSecondary: false });
    },
    onSubmit() {
      setState({ loadingSecondary: true });
    },
    // biome-ignore lint/suspicious/useAwait: SvelteKit async signature
    async onUpdate({ result }) {
      setState({ form: { hasErrors: false, success: false }, loadingSecondary: false });

      if (result.type === 'success') {
        setState({ form: { hasErrors: false, success: true } });
      } else if (result.type === 'failure') {
        // This handles validation failures (fail(400, { form }))
        setState({ form: { hasErrors: true, success: false } });

        // Add detailed error logging
        log.error('signup form validation failed', {
          data: result.data,
          status: result.status,
          type: result.type
        });

        if (!isEmpty(result.data?.form?.errors)) {
          log.error('form field errors', result.data.form.errors);
        }

        // Check if there's a specific error message from the server
        const serverError = result.data?.form?.error;
        if (serverError) {
          log.error('server error message', serverError);
          toast.error(serverError);
        } else if (isEmpty(result.data?.form?.errors)) {
          // Fallback for unknown validation failure
          toast.error(m.signUpFailure());
        } else {
          // If there are field errors but no general error, show generic message
          toast.error(m.signUpFailure());
        }
      } else {
        // Handle other result types (like 'redirect')
        log.error('unexpected result type', result);
      }
    }
  });

  return form;
};
