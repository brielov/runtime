import { from, None, Option } from "./option.ts";
import { Err, isErr, map, Ok, Result } from "./result.ts";
import { isNil, isPlainObject } from "./util.ts";

export type ParseError = {
  path: string[];
  message: string;
  input: unknown;
};

export interface Schema<T> {
  type: string;
  parse(input: unknown): Result<T, ParseError>;
}

export type PlainObject = { [key: PropertyKey]: unknown };
export type Infer<T> = T extends Schema<infer U> ? U : never;
type Shape<T extends PlainObject> = { [K in keyof T]: Schema<T[K]> };

export interface ObjectSchema<T extends PlainObject> extends Schema<T> {
  shape: Shape<T>;
}

const createErr = (message: string, input: unknown): Err<ParseError> =>
  Err({
    path: [],
    message,
    input,
  });

export const string = (): Schema<string> => ({
  type: "string",
  parse: (input) =>
    typeof input === "string"
      ? Ok(input)
      : createErr("Expecting string", input),
});

export const number = (): Schema<number> => ({
  type: "number",
  parse: (input) =>
    typeof input === "number" && Number.isFinite(input)
      ? Ok(input)
      : createErr("Expecting number", input),
});

export const boolean = (): Schema<boolean> => ({
  type: "boolean",
  parse: (input) =>
    typeof input === "boolean"
      ? Ok(input)
      : createErr("Expecting boolean", input),
});

export const date = (): Schema<Date> => ({
  type: "date",
  parse: (input) =>
    input instanceof Date && Number.isFinite(input.getTime())
      ? Ok(new Date(input))
      : createErr("Expecting valid date", input),
});

export const array = <T>(schema: Schema<T>): Schema<T[]> => ({
  type: `array<${schema.type}>`,
  parse: (input) => {
    if (!Array.isArray(input)) return createErr("Expecting array", input);
    const arr: T[] = new Array(input.length);
    for (let i = 0; i < input.length; i++) {
      const result = schema.parse(input[i]);
      if (isErr(result)) {
        result.error.path.unshift(i.toString());
        return result;
      }
      arr[i] = result.value;
    }
    return Ok(arr);
  },
});

export const object = <T extends PlainObject>(
  shape: Shape<T>,
): ObjectSchema<T> => ({
  shape,
  type: "object",
  parse: (input) => {
    if (!isPlainObject(input)) return createErr("Expecting object", input);
    const obj = Object.create(null);
    for (const key in shape) {
      const result = shape[key].parse(input[key]);
      if (isErr(result)) {
        result.error.path.unshift(key);
        return result;
      }
      obj[key] = result.value;
    }
    return Ok(obj);
  },
});

export const optional = <T>(schema: Schema<T>): Schema<Option<T>> => ({
  ...schema,
  type: `option<${schema.type}>`,
  parse: (input) => (isNil(input)) ? Ok(None) : map(schema.parse(input), from),
});

export const defaulted = <T>(
  schema: Schema<T>,
  defaultValue: T,
): Schema<T> => ({
  ...schema,
  parse: (input) => isNil(input) ? Ok(defaultValue) : schema.parse(input),
});
