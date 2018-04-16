import * as Koa from 'koa';
import Router, { SymbolRoutePrefix } from '../router';
import { normalizePath, isArray, Decorate } from '../utils';

let requestID = 0;
const classMethods: Json = {};

declare module 'koa' {
  interface Request {
    body: any;
  }
}

export interface RequiredBody {
  [key: string]: string;
}

export interface RouterConfig {
  method: string;
  path: string;
  unless?: boolean;
}

export interface RequiredConfig {
  params?: string | string[];
  query?: string | string[];
  body?: RequiredBody;
}

export const route = (config: RouterConfig): Function => {
  return (target: any, name: string, value: ParameterDecorator) => {
    config.path = normalizePath(config.path);
    if (!Array.isArray(classMethods[target])) {
      classMethods[target.name] = [];
    }
    classMethods[target.name].push({ target, config, controllers: target[name] });
  };
};

export const get = (options: { path: string; unless?: boolean }) => {
  return route({
    method: 'get',
    ...options
  });
};

export const post = (options: { path: string; unless?: boolean }) => {
  return route({
    method: 'post',
    ...options
  });
};

export const put = (options: { path: string; unless?: boolean }) => {
  return route({
    method: 'put',
    ...options
  });
};

export const del = (options: { path: string; unless?: boolean }) => {
  return route({
    method: 'delete',
    ...options
  });
};

export const patch = (options: { path: string; unless?: boolean }) => {
  return route({
    method: 'patch',
    ...options
  });
};

export const controller = (path: string): Function => {
  return (target: any) => {
    for (const classMethod of classMethods[target.name]) {
      target[SymbolRoutePrefix] = path;
      Router._DecoratedRouters.set(
        {
          target,
          ...classMethod.config
        },
        classMethod.controllers
      );
    }
  };
};

export const middleware = (convert: (...args: any[]) => Promise<any>) => {
  return (...args: any[]) => Decorate(args, convert);
};

export const required = (rules: RequiredConfig) => {
  return (...args: any[]) => {
    return Decorate(args, async (ctx: Koa.Context, next: Function) => {
      const method = ctx.method.toLowerCase();
      if (rules.params) {
        rules.params = isArray(rules.params);
        for (const name of rules.params) {
          if (!ctx.params[name]) ctx.throw(412, `${method} Request params: ${name} required`);
        }
      }
      if (rules.query) {
        rules.query = isArray(rules.query);
        for (const name of rules.query) {
          if (!ctx.query[name]) ctx.throw(412, `${method} Request query: ${name} required`);
        }
      }
      if (rules.body) {
        const req = ctx.request.body;
        if (!req) {
          ctx.throw(412, `${method} request body are required`);
        }
        for (const name of Object.keys(rules.body)) {
          if (!req[name]) ctx.throw(412, `${method} request body: ${name} required`);
          if (typeof req[name] != rules.body[name])
            ctx.throw(412, `${method} request body: ${name} is ${rules.body[name]}`);
        }
      }
      await next();
    });
  };
};