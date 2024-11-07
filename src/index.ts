'use strict';

import { Logger } from 'sitka';
import { readFile } from 'node:fs/promises';
import { Config } from './lib/Config';

export class AccountStatementParser {
    /* Private Instance Fields */
    config = new Config();
    private _logger: Logger;

    /* Constructor */

    constructor() {
        this._logger = Logger.getLogger({name: this.constructor.name});
    }

    /* Public Instance Methods */
    public async run(): Promise<void> {
        this._logger.debug('Parameters: ' + process.argv);
        const filename = process.argv[2] || 'config.json';
        this._logger.debug('Using config from ' + filename);
        try {
            const configString = await readFile(filename, 'utf-8');
            this.config = JSON.parse(configString);
        } catch (e) {
            this._logger.error('Error reading config file: ' + e);
            return;
        }
    }
}

new AccountStatementParser().run().catch(e => {
    console.error(e);
    process.exit(1);
});
