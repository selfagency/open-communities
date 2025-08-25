export const log = {
	debug: () => {},
	error: () => {},
	getSubLogger: () => ({
		debug: () => {},
		error: () => {},
		info: () => {},
		warn: () => {}
	}),
	info: () => {},
	warn: () => {}
};

export async function logEvent() {
	return;
}

export default log;
