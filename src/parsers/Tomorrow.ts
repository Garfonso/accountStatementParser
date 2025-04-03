import { Parser } from './Parser';
import { Entry } from './Entry';
import {Logger, LogLevel} from 'sitka';

const startBite = 'Betrag';
const betragRegex = /([-+])(\d+)%2C(\d{2}).*%E2%82%AC/;
const ibanAndBicRegex = /IBAN: ([a-zA-Z]{2}[0-9]{20}) . BIC: ([a-zA-Z0-9]+).*/;

export default class Tomorrow implements Parser {
    private _logger: Logger;
    owner: string;
    name: string;

    constructor(owner: string, name: string, logLevel: LogLevel = LogLevel.DEBUG) {
        this._logger = Logger.getLogger({name: 'TomorrowParser', level: logLevel});
        this.owner = owner;
        this.name = name;
    }

    parse(data: Array<string>): Array<Entry> {
        //logger.debug('Parsing Tomorrow', data);
        const entries: Array<Entry> = [];
        let skippingToStart = true;
        let haveDate = false;
        let haveCorrespondent = false;
        let numSkipped = 0;
        let currentEntry = new Entry({owner: this.owner, account: this.name});
        for (const textBite of data) {
            this._logger.debug('got: ' + textBite);
            if (skippingToStart) {
                if (textBite === startBite) {
                    skippingToStart = false;
                    this._logger.debug('Found start');
                }
            } else {
                if (!haveDate) {
                    if (numSkipped === 0) {
                        numSkipped += 1;
                    } else {
                        currentEntry.date = textBite;
                        haveDate = true;
                        numSkipped = 0;
                        this._logger.debug('Found date: ', currentEntry.date);
                    }
                } else if (!haveCorrespondent) {
                    currentEntry.correspondent = decodeURIComponent(textBite);
                    haveCorrespondent = true;
                    this._logger.debug('Found correspondent: ', currentEntry.correspondent);
                } else {
                    const decoded = decodeURIComponent(textBite);
                    if (betragRegex.test(textBite)) {
                        const parts = betragRegex.exec(textBite);
                        if (parts) {
                            currentEntry.amount = parseFloat(parts[1] + parts[2] + '.' + parts[3]);
                        } else {
                            this._logger.error('Error parsing amount: ', textBite);
                            currentEntry.amount = 0;
                        }
                        this._logger.debug('Found amount: ', currentEntry.amount);
                        //and we are done...
                        haveDate = false;
                        haveCorrespondent = false;
                        entries.push(currentEntry);
                        this._logger.debug('Found entry: ', currentEntry);
                        currentEntry = new Entry({owner: this.owner, account: this.name});
                    } else if (ibanAndBicRegex.test(decoded)) {
                        const parts = ibanAndBicRegex.exec(decoded);
                        currentEntry.IBAN = parts && parts[1] || 'NA';
                        currentEntry.BIC = parts && parts[2] || 'NA';
                        this._logger.debug('Found IBAN: ', currentEntry.IBAN, ' BIC: ', currentEntry.BIC);
                    } else {
                        currentEntry.description += decoded;
                    }
                }
            }
        }
        return entries;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    parseRawText(_text: string): Array<Entry> {
        //not supported right now.
        return [];
    }
}
