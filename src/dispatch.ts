import { assert } from './deps.ts';
import { globToRegExp } from 'https://deno.land/std@0.71.0/path/glob.ts';

export interface Dispatch<T> {
  methods: string[]
  dispatch(name: string, input: T, args: unknown[]): DispatchResult;
}

export type DispatchResult = {
  handled: true;
  value: unknown;
} | {
  handled: false;
  value: void;
}

export interface DispatchMethod<TContext> {
  (context: TContext, args: unknown[]): unknown;
}

export type DispatchArg = string | number | boolean;

export interface DispatchOptions<T, TContext> {
  methods: Record<string, DispatchMethod<TContext>>;
  patterns: Record<string, string | [string, ...DispatchArg[]]>
  context?(input: T): TContext;
}

export function createDispatch<T, TContext = T>(options: DispatchOptions<T, TContext>): Dispatch<T> {
  return {
    methods: Object.keys(options.methods),
    dispatch(name: string, input: T, args: unknown[]) {
      let method = findMethod(options, name);
      if (method) {
        let context = options.context ? options.context(input) : input;
        return {
          handled: true,
          value: method(context as TContext, args),
        };
      } else {
        return { handled: false, value: void 0 };
      }
    }
  };
}

function findMethod<T, TContext>(options: DispatchOptions<T, TContext>, name: string) {
  return options.methods[name] ?? matchMethod(options, name);
}

function matchMethod<T, TContext>(options: DispatchOptions<T, TContext>, name: string) {
  for (let [pattern, spec] of Object.entries(options.patterns)) {
    if (match(pattern, name)) {
      let [name, ...args] = typeof spec === 'string' ? [spec] : spec;
      let fn = options.methods[name];
      assert(fn, `pattern '${pattern}' references an unknown method ${name}`);
      return (context: TContext) => fn(context, args);
    }
  }
}

function match(pattern: string, name: string): boolean {
  return globToRegExp(pattern).test(name);
}
