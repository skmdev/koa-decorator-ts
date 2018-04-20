import Koa from 'koa';
import { isArray } from '../utils';

export const graphql = (target: any, name: string, descriptor: any): any => {
  const middleware = isArray(target[name]);
  descriptor.value = async (obj: any, args: any, context: Koa.Context, info: any) => {
    let data = { body: {} };
    composeResolver(middleware)(data, obj, args, context, info);
  };
};

function composeResolver(middleware: Function[]) {
  if (!Array.isArray(middleware)) throw new TypeError('Middleware stack must be an array!');
  for (const fn of middleware) {
    if (typeof fn !== 'function') throw new TypeError('Middleware must be composed of functions!');
  }

  return function(data: any, obj: any, args: any, context: Koa.Context, info: any) {
    let next: Function;
    // last called middleware #
    let index = -1;
    return dispatch(0);
    function dispatch(i: number) {
      if (i <= index) return Promise.reject(new Error('next() called multiple times'));
      index = i;
      let fn = middleware[i];
      if (i === middleware.length) fn = next;
      if (!fn) return Promise.resolve();
      try {
        if (i + 1 === middleware.length) {
          data.body = Promise.resolve(fn(obj, args, context, info));
          return data.body;
        } else {
          return Promise.resolve(
            fn(context, function next() {
              return dispatch(i + 1);
            }),
          );
        }
      } catch (err) {
        return Promise.reject(err);
      }
    }
  };
}
