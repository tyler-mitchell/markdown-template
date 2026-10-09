import type { Module, Type } from "#arktype";

export type Values = Record<string, unknown>;

/** UTF-16 offsets relative to the Markdown body. */
export interface SourceRange {
  readonly offset: number;
  readonly end: number;
}

export interface Expression extends SourceRange {
  readonly kind: "expression";
  /** Authored interpolation, including its delimiters. */
  readonly source: string;
}

export interface Escape extends SourceRange {
  readonly kind: "escape";
  readonly value: string;
}

export interface Element extends SourceRange {
  readonly kind: "element";
  readonly inline: boolean;
  readonly name: string;
  /** Authored opening tag. */
  readonly source: string;
  readonly bodyOffset: number;
  readonly bodyEnd: number;
  /** Opening tag indentation in Markdown columns. */
  readonly indent: number;
  /** Indentation removed when rendering the body. */
  readonly bodyIndent: number;
  readonly children: readonly Part[];
}

export type Part = Expression | Escape | Element;

export type InputName<Schema extends Module> = {
  [Name in keyof Schema]: Schema[Name] extends Type<any, any> ? Name : never;
}[keyof Schema] &
  string;

export interface CompileOptions<
  Schema extends Module = Module<Record<string, unknown>>,
  Name extends InputName<Schema> | undefined = InputName<Schema> | undefined,
> {
  /** Native module; overrides the frontmatter schema. */
  schema?: Schema;
  /** Argument type export; overrides frontmatter input. */
  input?: Name;
  /** Named documents or literal text resolved by include tags. */
  includes?: Record<string, string | { readonly source?: string; render(values: Values): string }>;
}

export type RenderArguments<Input extends Type<any, any> | undefined> = undefined extends Input
  ? [values?: Values]
  : Input extends Type<any, any>
    ? {} extends Input["inferIn"]
      ? [values?: Input["inferIn"]]
      : [values: Input["inferIn"]]
    : never;

/** Compiled source, native schemas, and Markdown rendering. */
export interface CompiledDocument<
  Schema extends Module = Module<Record<string, unknown>>,
  Input extends Type<any, any> | undefined = Type<unknown, any> | undefined,
> {
  readonly source: string;
  readonly file?: string;
  /** Markdown body without frontmatter. */
  readonly content: string;
  /** UTF-16 offset of the Markdown body in source. */
  readonly contentOffset: number;
  readonly frontmatter: Readonly<Record<string, unknown>>;
  /** Authored template constructs; excludes Markdown tokens and parser internals. */
  readonly children: readonly Part[];
  readonly schemas: Schema;
  readonly input: Input;
  /** Native Standard Schema validation and JSON Schema conversion. */
  readonly standard: Input extends Type<any, any> ? Input["~standard"] : undefined;
  /** Validates raw arguments with the selected native schema before rendering. */
  render(this: void, ...args: RenderArguments<Input>): string;
  /** Renders native schema output without applying its transforms again. */
  renderValidated(
    this: void,
    values: Input extends Type<any, any> ? Input["infer"] : Values,
  ): string;
}

export type SelectedInput<Schema extends Module, Name> = Name extends keyof Schema
  ? Schema[Name] extends Type<any, any>
    ? Schema[Name]
    : never
  : Type<unknown, any> | undefined;

/** A compiled file and its resolved document or raw-text dependencies. */
export interface LoadedDocument extends CompiledDocument {
  readonly file: string;
  readonly includes: Readonly<Record<string, LoadedDocument | string>>;
}
