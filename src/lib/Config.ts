import {readFile} from 'node:fs/promises';
import {ParserConfig} from './ParserConfig';
import {Logger} from 'sitka';

export class Config {
    parsers: Array<ParserConfig> = [];
    outputPath: string = '.';

    async readConfig(path = './config.json', logger: Logger) {
        try {
            const configString = await readFile(path, 'utf-8');
            const configObj = JSON.parse(configString);
            this.parsers = configObj.parsers || [];
            this.outputPath = configObj.outputPath || '.';
        } catch (e) {
            logger.error('Error reading config file: ' + e);
        }
    }
}
