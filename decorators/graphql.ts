import Koa from 'koa';
import compose from 'koa-compose';
import { isArray } from '../utils';

export interface IContext extends Koa.Context {
  graphql: {
    root: any;
    args: any;
    info: any;
  };
}

export const Graphql = (target: any, name: string, descriptor: any): any => {
  const middleware = isArray(target[name]);
  descriptor.value = async (
    root: any,
    args: any,
    context: IContext,
    info: any
  ) => {
    context.graphql = {
      root,
      args,
      info
    };
    await compose<IContext>(middleware)(context);
    return context.body;
  };
};
