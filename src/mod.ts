import { Err, None, Ok, Option, Result, Some } from "oxido";

type ParseError = {
  path: string[];
  message: string;
  input: unknown;
};

export interface Schema<T> {
  type: string;
  parse(input: unknown): Result<T, ParseError>;
}

type PlainObject = { [key: PropertyKey]: unknown };
export type Infer<T> = T extends Schema<infer U> ? U : never;
export type Shape<T extends PlainObject> = { [K in keyof T]: Schema<T> };

export interface ObjectSchema<T extends PlainObject> extends Schema<T> {
  shape: Shape<T>;
}

const createErr = (
  message: string,
  input: unknown,
  // deno-lint-ignore no-explicit-any
): Result<any, ParseError> =>
  Err({
    path: [],
    message,
    input,
  });

const isPlainObject = (input: unknown): input is PlainObject => {
  if (typeof input === "undefined" || input === null) return false;
  const proto = Object.getPrototypeOf(input);
  return proto === null || proto === Object.prototype;
};

export const string = (): Schema<string> => ({
  type: "string",
  parse: (input) =>
    typeof input === "string" ? Ok(input) : createErr("Not a string", input),
});

export const number = (): Schema<number> => ({
  type: "number",
  parse: (input) =>
    typeof input === "number" && Number.isFinite(input)
      ? Ok(input)
      : createErr("Expecting finite number", input),
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
      if (result.isErr()) {
        const err = result.unwrapErr();
        err.path.unshift(i.toString());
        return Err(err);
      }
      arr[i] = result.unwrap();
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
      if (result.isErr()) {
        const err = result.unwrapErr();
        err.path.unshift(key);
        return Err(err);
      }
      obj[key] = result.unwrap();
    }
    return Ok(obj);
  },
});

// deno-lint-ignore ban-types
export const optional = <T extends {}>(
  schema: Schema<T>,
): Schema<Option<T>> => ({
  ...schema,
  type: `option<${schema.type}>`,
  parse: (input) => {
    if (typeof input === "undefined" || input === null) {
      return Ok(None as Option<T>);
    }
    return schema.parse(input).map((value) => Some(value));
  },
});

export const defaulted = <T>(
  schema: Schema<T>,
  defaultValue: T,
): Schema<T> => ({
  ...schema,
  parse: (input) => {
    if (typeof input === "undefined" || input === null) return Ok(defaultValue);
    return schema.parse(input);
  },
});
