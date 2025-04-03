export type ParserConfig = {
    name?: string; //name of the parser, can equal the class name
    className: string; //class name of the parser
    path: string; //path to the file to parse
    owner: string; //owner of the files to parse
    disabled?: boolean; //disable this parser
    debug: boolean; //enable debug logging
}