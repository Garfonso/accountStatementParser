'use strict';

import { Logger } from 'sitka';
import { readFile } from 'node:fs/promises';
import { Config } from './lib/Config';
import {Logger, LogLevel} from 'sitka';
import {Config} from './lib/Config';
import {readDirecotry} from './parsers/ParserMethods';

export class AccountStatementParser {
    /* Private Instance Fields */
    config = new Config();
    private _logger: Logger;

    /* Constructor */

    constructor() {
        this._logger = Logger.getLogger({name: this.constructor.name, level: LogLevel.DEBUG});
    }

    /* Public Instance Methods */
    public async run(): Promise<void> {
        this._logger.debug('Parameters: ' + process.argv);
        const filename = process.argv[2] || './config.json';
        this._logger.debug('Using config from ' + filename);
        await this.config.readConfig(filename, this._logger);
        this._logger.debug('Config: ' + JSON.stringify(this.config));

        for (const parserConfig of this.config.parsers) {
            if (!parserConfig.name) {
                parserConfig.name = parserConfig.className;
            }
            this._logger.debug('Processing parser: ' + parserConfig.name);
            if (parserConfig.disabled) {
                this._logger.debug('Parser is disabled, skipping.');
                continue;
            }
            this._logger.debug('Loading parser: ' + parserConfig.className);
            const parserClass = (await import('./parsers/' + parserConfig.className)).default;
            const parser = new parserClass(parserConfig.owner, parserConfig.name, parserConfig.debug ? LogLevel.DEBUG : LogLevel.INFO);
            const entries = await readDirecotry(parser, parserConfig.path, this._logger);
            this._logger.debug('Found ' + entries.length + ' entries');
        }

        this._logger.debug('Done');
    }
}

new AccountStatementParser().run().catch(e => {
    console.error(e);
    process.exit(1);
});
