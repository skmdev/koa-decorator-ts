import Koa from 'koa';
import compose from 'koa-compose';
import { isArray } from '../utils';

export const Graphql = (target: any, name: string, descriptor: any): any => {
  const middleware = isArray(target[name]);
  descriptor.value = async (root: any, args: any, context: Koa.Context, info: any) => {
    context.graphql = {
      root,
      args,
      info,
    };
    compose<Koa.Context>(middleware)(context);
    return context.body;
  };
};
