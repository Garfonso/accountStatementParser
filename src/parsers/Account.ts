import { Entry } from './Entry';

export class Account {
    IBAN = '';
    BIC = '';
    comment = '';
    owner = '';
    account = '';
    files: Array<string> = [];
    entries: Array<Entry> = [];

    constructor({ IBAN = '', BIC = '', owner = '', account = '' }:
                { IBAN?: string, BIC?: string, owner?: string, account?: string; } = {}) {
        Object.assign(this, { IBAN, BIC, owner, account });
    }
}
