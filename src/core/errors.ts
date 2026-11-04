/** A syntax failure located in the complete authored document. */
export class TemplateSyntaxError extends SyntaxError {
  readonly offset: number;
  readonly end: number;
  readonly line: number;
  readonly column: number;
  readonly file?: string;

  constructor({
    message,
    source,
    offset,
    end,
    cause,
    file,
  }: {
    message: string;
    source: string;
    offset: number;
    end: number;
    cause?: unknown;
    file?: string;
  }) {
    const before = source.slice(0, offset);
    const line = before.split("\n").length;
    const column = offset - before.lastIndexOf("\n");
    super(`${file ? `${file}: ` : ""}${message} (line ${line}, column ${column})`, { cause });
    this.name = "TemplateSyntaxError";
    this.offset = offset;
    this.end = end;
    this.line = line;
    this.column = column;
    this.file = file;
  }
}
