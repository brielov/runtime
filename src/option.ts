import { Err, Ok, Result } from "./result.ts";
import { identity, isNil, raise } from "./util.ts";

export type Some<T> = { readonly some: true; readonly value: T };
export type None = { readonly some: false };
export type Option<T> = Some<T> | None;

export const Some = <T>(value: NonNullable<T>): Some<T> => ({
  some: true,
  value,
});

export const None: None = { some: false };

export const from = <T>(value: T | null | undefined): Option<T> =>
  isNil(value) ? None : Some(value as NonNullable<T>);

Object.freeze(None);

export const isSome = <T>(option: Option<T>): option is Some<T> => option.some;
export const isNone = <T>(option: Option<T>): option is None => !option.some;

export const isSomeAnd = <T>(
  option: Option<T>,
  fn: (value: T) => boolean,
): boolean => isSome(option) && fn(option.value);

export const match = <T, U>(
  option: Option<T>,
  onSome: (value: T) => U,
  onNone: () => U,
): U => isSome(option) ? onSome(option.value) : onNone();

export const and = <T, U>(option: Option<T>, other: Option<U>): Option<U> =>
  match(option, () => other, () => option as Option<U>);

export const andThen = <T, U>(
  option: Option<T>,
  fn: (value: T) => Option<U>,
): Option<U> => match(option, fn, () => option as Option<U>);

export const expect = <T>(option: Option<T>, message: string): T =>
  match(option, identity, () => raise(message));

export const filter = <T>(
  option: Option<T>,
  fn: (value: T) => boolean,
): Option<T> => (isSome(option) && fn(option.value)) ? option : None;

export const map = <T, U>(
  option: Option<T>,
  fn: (value: T) => NonNullable<U>,
): Option<U> =>
  match(option, (value) => Some(fn(value)), () => option as Option<U>);

export const mapOr = <T, U>(
  option: Option<T>,
  defaultValue: NonNullable<U>,
  fn: (value: T) => NonNullable<U>,
): U => match(option, fn, () => defaultValue);

export const mapOrElse = <T, U>(
  option: Option<T>,
  fallback: () => U,
  fn: (value: T) => U,
): U => match(option, fn, fallback);

export const toOk = <T, E>(option: Option<T>, err: E): Result<T, E> =>
  match(option, (value) => Ok(value) as Result<T, E>, () => Err(err));

export const okOrElse = <T, E>(option: Option<T>, fn: () => E): Result<T, E> =>
  match(option, (value) => Ok(value) as Result<T, E>, () => Err(fn()));

export const or = <T>(option: Option<T>, other: Option<T>): Option<T> =>
  match(option, () => option, () => other);

export const orElse = <T>(option: Option<T>, fn: () => Option<T>): Option<T> =>
  match(option, () => option, fn);

export const unwrap = <T>(option: Option<T>): T =>
  match(
    option,
    identity,
    () => raise("called `Option.unwrap` on an `Err` value"),
  );

export const unwrapOr = <T>(option: Option<T>, defaultValue: T): T =>
  match(option, identity, () => defaultValue);

export const unwrapOrElse = <T>(option: Option<T>, fallback: () => T): T =>
  match(option, identity, fallback);

export const xor = <T>(left: Option<T>, right: Option<T>): Option<T> => {
  if (isSome(left) && isNone(right)) return left;
  if (isNone(left) && isSome(right)) return right;
  return None;
};
