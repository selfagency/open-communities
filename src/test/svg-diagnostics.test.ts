import { expect, test } from 'vitest';

test('svg import shapes', async () => {
  // Import the assets the app uses with the ?component query to see what
  // the test environment actually resolves for these specifiers.
  const findMod = await import('$lib/assets/find.svg?component');
  const maskMod = await import('$lib/assets/mask.svg?component');
  const aslMod = await import('$lib/assets/asl.svg?component');

  // Also import the direct mock module file using the $test alias so we can
  // compare what the aliased `?component` specifier returns vs the actual
  // mock implementation sitting under `src/test/mocks/assets`.
  const findMockDirect = await import('$test/mocks/assets/find.svg.js');
  const maskMockDirect = await import('$test/mocks/assets/mask.svg.js');
  const aslMockDirect = await import('$test/mocks/assets/asl.svg.js');

  // Print shapes so the test runner log shows what's being returned.
  // The output is intentionally verbose to aid debugging.
  console.log('findMod keys:', Object.keys((findMod || {}) as Record<string, unknown>));
  console.log('findMod default type:', typeof (findMod as Record<string, unknown>)['default']);
  console.log(
    'findMod default value (truncated):',
    String((findMod as Record<string, unknown>)['default']).slice(0, 200)
  );

  console.log('maskMod keys:', Object.keys((maskMod || {}) as Record<string, unknown>));
  console.log('maskMod default type:', typeof (maskMod as Record<string, unknown>)['default']);
  console.log(
    'maskMod default value (truncated):',
    String((maskMod as Record<string, unknown>)['default']).slice(0, 200)
  );

  console.log('aslMod keys:', Object.keys((aslMod || {}) as Record<string, unknown>));
  console.log('aslMod default type:', typeof (aslMod as Record<string, unknown>)['default']);
  console.log(
    'aslMod default value (truncated):',
    String((aslMod as Record<string, unknown>)['default']).slice(0, 200)
  );

  console.log('--- direct mock modules ---');
  console.log('findMockDirect keys:', Object.keys((findMockDirect || {}) as Record<string, unknown>));
  console.log('findMockDirect default type:', typeof (findMockDirect as Record<string, unknown>)['default']);
  console.log(
    'findMockDirect default value (truncated):',
    String((findMockDirect as Record<string, unknown>)['default']).slice(0, 200)
  );
  console.log('maskMockDirect keys:', Object.keys((maskMockDirect || {}) as Record<string, unknown>));
  console.log('maskMockDirect default type:', typeof (maskMockDirect as Record<string, unknown>)['default']);
  console.log(
    'maskMockDirect default value (truncated):',
    String((maskMockDirect as Record<string, unknown>)['default']).slice(0, 200)
  );
  console.log('aslMockDirect keys:', Object.keys((aslMockDirect || {}) as Record<string, unknown>));
  console.log('aslMockDirect default type:', typeof (aslMockDirect as Record<string, unknown>)['default']);
  console.log(
    'aslMockDirect default value (truncated):',
    String((aslMockDirect as Record<string, unknown>)['default']).slice(0, 200)
  );

  // Make assertions to fail fast if the shape is not a callable constructor.
  expect(typeof (findMod as Record<string, unknown>)['default']).toBe('function');
  expect(typeof (maskMod as Record<string, unknown>)['default']).toBe('function');
  expect(typeof (aslMod as Record<string, unknown>)['default']).toBe('function');
});
