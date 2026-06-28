export const log = {
  // biome-ignore lint/suspicious/noEmptyBlockStatements: intentional noop mock
  debug: () => {},
  // biome-ignore lint/suspicious/noEmptyBlockStatements: intentional noop mock
  error: () => {},
  getSubLogger: () => ({
    // biome-ignore lint/suspicious/noEmptyBlockStatements: intentional noop mock
    debug: () => {},
    // biome-ignore lint/suspicious/noEmptyBlockStatements: intentional noop mock
    error: () => {},
    // biome-ignore lint/suspicious/noEmptyBlockStatements: intentional noop mock
    info: () => {},
    // biome-ignore lint/suspicious/noEmptyBlockStatements: intentional noop mock
    warn: () => {}
  }),
  // biome-ignore lint/suspicious/noEmptyBlockStatements: intentional noop mock
  info: () => {},
  // biome-ignore lint/suspicious/noEmptyBlockStatements: intentional noop mock
  warn: () => {}
};

// biome-ignore lint/suspicious/useAwait: required by SvelteKit type signature
export async function logEvent() {
  return;
}

export default log;
