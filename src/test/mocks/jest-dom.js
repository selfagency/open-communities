// Lightweight re-export of the jest-dom matchers so importing
// '@testing-library/jest-dom' in tests doesn't call expect.extend
// at module-eval time (which can run before Vitest sets up globals).
import * as matchers from '@testing-library/jest-dom/matchers';

// Export the matcher object as the default and named exports so both
// `import '@testing-library/jest-dom'` and `import matchers from '.../matchers'`
// work for our setup.
export default matchers;
export * from '@testing-library/jest-dom/matchers';
