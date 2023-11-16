export const isNil = <T>(
  value: T | null | undefined,
): value is null | undefined => {
  return typeof value === "undefined" || value === null;
};

export const isPresent = <T>(value: T): value is NonNullable<T> =>
  !isNil(value);

export const identity = <T>(value: T): T => value;

export const isPlainObject = (
  input: unknown,
): input is { [key: PropertyKey]: unknown } => {
  if (isNil(input)) return false;
  const proto = Object.getPrototypeOf(input);
  return proto === null || proto === Object.prototype;
};

export function raise(message: string, cause?: unknown): never {
  throw new Error(message, { cause });
}
