/* region imports */
import { Logger } from 'tslog';

import { dev } from '$app/environment';
/* endregion imports */

const logger = new Logger(
	{
		type: 'pretty',
		hideLogPositionForProduction: dev,
		prettyLogTemplate: '{{yyyy}}/{{mm}}/{{dd}} {{hh}}:{{MM}}:{{ss}} {{logLevelName}} [{{name}}] ',
		prettyErrorTemplate: '{{errorName}}: {{errorMessage}}\n{{errorStack}}',
		prettyErrorStackTemplate: '{{method}} - {{filePathWithLine}}'
	},
	{ main: true, sub: false }
);

const log = logger.getSubLogger({ name: 'frontend' });

export { logger, log };
