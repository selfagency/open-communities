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

// biome-ignore lint/suspicious/noEmptyBlockStatements: intentional noop mock
export async function logEvent() {}

// biome-ignore lint/complexity/noRedundantDefaultExport: mock module may be imported via default
export default log;
