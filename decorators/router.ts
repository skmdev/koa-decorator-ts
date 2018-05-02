import * as Koa from 'koa';
import Router, { SymbolRoutePrefix } from '../router';
import { normalizePath, isArray, Decorate } from '../utils';

const classMethods: any = {};

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

const route = (config: RouterConfig): Function => {
  return (target: any, name: string, value: ParameterDecorator) => {
    config.path = normalizePath(config.path);
    if (!Array.isArray(classMethods[target.name])) {
      classMethods[target.name] = [];
    }
    classMethods[target.name].push({ target, config, controllers: target[name] });
  };
};

const get = (options: { path: string; unless?: boolean }) => {
  return route({
    method: 'get',
    ...options,
  });
};

const post = (options: { path: string; unless?: boolean }) => {
  return route({
    method: 'post',
    ...options,
  });
};

const put = (options: { path: string; unless?: boolean }) => {
  return route({
    method: 'put',
    ...options,
  });
};

const del = (options: { path: string; unless?: boolean }) => {
  return route({
    method: 'delete',
    ...options,
  });
};

const patch = (options: { path: string; unless?: boolean }) => {
  return route({
    method: 'patch',
    ...options,
  });
};

export const Route = {
  get,
  post,
  patch,
  put,
  del,
};

export const Controller = (path: string): Function => {
  return (target: any) => {
    if (!Array.isArray(classMethods[target.name])) return;
    for (const classMethod of classMethods[target.name]) {
      target[SymbolRoutePrefix] = path;
      Router._DecoratedRouters.set(
        {
          target,
          ...classMethod.config,
        },
        classMethod.controllers,
      );
    }
  };
};

export const Middleware = (convert: (...args: any[]) => Promise<any>) => {
  return (...args: any[]) => Decorate(args, convert);
};

export const Required = (rules: RequiredConfig) => {
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
          ctx.throw(412, `${method} Request body are required`);
        }
        for (const name of Object.keys(rules.body)) {
          if (!req[name]) ctx.throw(412, `${method} Request body: ${name} required`);
          if (typeof req[name] != rules.body[name])
            ctx.throw(412, `${method} Request body: ${name} is ${rules.body[name]}`);
        }
      }
      await next();
    });
  };
};
