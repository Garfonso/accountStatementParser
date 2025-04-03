import {Entry} from './Entry';

export interface Parser {
    owner: string;
    name: string;

    /* Public Instance Methods */
    parse(data: Array<string>): Array<Entry>;
    parseRawText(text: string): Array<Entry>;
}
