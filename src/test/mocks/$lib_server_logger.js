export const log = {
  getSubLogger: () => ({
    error: () => {},
    info: () => {}
  })
};

export async function logEvent() {
  return;
}

export default log;
