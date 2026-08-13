// Mock for sveltekit-superforms using shared utilities
import { mockSveltekitSuperforms } from '../testUtils.js';

// Named exports
const { message, setError, superForm, superValidate } = mockSveltekitSuperforms;

export { message, setError, superForm, superValidate };

// Default export
export default mockSveltekitSuperforms;
