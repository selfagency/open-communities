// Mock for sveltekit-superforms using shared utilities
import { mockSveltekitSuperforms } from '../testUtils.js';

// Named exports
export const superForm = mockSveltekitSuperforms.superForm;
export const setError = mockSveltekitSuperforms.setError;
export const message = mockSveltekitSuperforms.message;
export const superValidate = mockSveltekitSuperforms.superValidate;

// Default export
export default mockSveltekitSuperforms;
