import { None, Option, Some } from "./option.ts";
import { identity, isPresent, raise } from "./util.ts";

export type Ok<T> = { readonly ok: true; readonly value: T };
export type Err<E> = { readonly ok: false; readonly error: E };
export type Result<T, E> = Ok<T> | Err<E>;

export const Ok = <T>(value: T): Ok<T> => ({ ok: true, value });
export const Err = <E>(error: E): Err<E> => ({ ok: false, error });

export const isOk = <T, E>(result: Result<T, E>): result is Ok<T> => result.ok;
export const isErr = <T, E>(result: Result<T, E>): result is Err<E> =>
  !result.ok;

export const isOkAnd = <T, E>(
  result: Result<T, E>,
  fn: (value: T) => boolean,
): boolean => isOk(result) && fn(result.value);

export const isErrAnd = <T, E>(
  result: Result<T, E>,
  fn: (error: E) => boolean,
): boolean => isErr(result) && fn(result.error);

export const match = <T, E, U>(
  result: Result<T, E>,
  onOk: (value: T) => U,
  onErr: (error: E) => U,
): U => isOk(result) ? onOk(result.value) : onErr(result.error);

export const and = <T, E, U>(
  result: Result<T, E>,
  other: Result<U, E>,
): Result<U, E> => match(result, () => other, () => result as Result<U, E>);

export const andThen = <T, E, U>(
  result: Result<T, E>,
  fn: (value: T) => Result<U, E>,
): Result<U, E> => match(result, fn, () => result as Result<U, E>);

export const toErr = <T, E>(result: Result<T, E>): Option<E> =>
  match(result, () => None, (error) => isPresent(error) ? Some(error) : None);

export const expect = <T, E>(result: Result<T, E>, message: string): T =>
  match(result, identity, (error) => raise(message, error));

export const expectErr = <T, E>(result: Result<T, E>, message: string): E =>
  match(result, (value) => raise(message, value), identity);

export const map = <T, E, U>(
  result: Result<T, E>,
  fn: (value: T) => U,
): Result<U, E> =>
  match(result, (value) => Ok(fn(value)), () => result as Result<U, E>);

export const mapErr = <T, E, F>(
  result: Result<T, E>,
  fn: (error: E) => F,
): Result<T, F> =>
  match(result, () => result as Result<T, F>, (error) => Err(fn(error)));

export const mapOr = <T, E, U>(
  result: Result<T, E>,
  defaultValue: U,
  fn: (value: T) => U,
): U => match(result, fn, () => defaultValue);

export const mapOrElse = <T, E, U>(
  result: Result<T, E>,
  fallback: (error: E) => U,
  fn: (value: T) => U,
): U => match(result, fn, fallback);

export const or = <T, E, F>(
  result: Result<T, E>,
  other: Result<T, F>,
): Result<T, F> => match(result, () => result as Result<T, F>, () => other);

export const orElse = <T, E, F>(
  result: Result<T, E>,
  fn: (error: E) => Result<T, F>,
): Result<T, F> => match(result, () => result as Result<T, F>, fn);

export const unwrap = <T, E>(result: Result<T, E>): T =>
  match(
    result,
    identity,
    (error) => raise("called `Result.unwrap` on an `Err` value", error),
  );

export const unwrapErr = <T, E>(result: Result<T, E>): E =>
  match(
    result,
    (value) => raise("called `Result.unwrapErr` on an `Ok` value", value),
    identity,
  );

export const unwrapOr = <T, E>(result: Result<T, E>, defaultValue: T): T =>
  match(result, identity, () => defaultValue);

export const unwrapOrElse = <T, E>(
  result: Result<T, E>,
  fn: (error: E) => T,
): T => match(result, identity, fn);
