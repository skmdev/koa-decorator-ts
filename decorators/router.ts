import Router, { SymbolRoutePrefix, MethodType } from '../router';
import { normalizePath, isArray, Decorate } from '../utils';
import { Context } from 'koa';

const classMethods: IClassMethodMap = {};

function updateMethodOptions(target: any, name: string, options: any) {
  if (!Array.isArray(classMethods[target.name])) {
    classMethods[target.name] = [];
  }
  const method = classMethods[target.name].find(
    (methodOptions) => methodOptions.name === name
  );

  for (const key in options) {
    if (method && typeof options[key] !== 'undefined') {
      method[key as keyof IMethodOptions] = options[key];
    }
  }

  if (!method) {
    classMethods[target.name].push({
      name,
      target,
      controllers: target[name],
      ...options
    });
  }
}

export const Unless: Function = (
  target: any,
  name: string,
  value: ParameterDecorator
) => {
  updateMethodOptions(target, name, { unless: true });
};

const route = (config: IRouterConfig): Function => {
  return (target: any, name: string, value: ParameterDecorator) => {
    config.path = normalizePath(config.path!);
    updateMethodOptions(target, name, { config });
  };
};

const getRoute = (method: MethodType) => (path: string) =>
  route({ method, path });

export const Route = {
  get: getRoute(MethodType.Get),
  post: getRoute(MethodType.Post),
  put: getRoute(MethodType.Put),
  del: getRoute(MethodType.Delete),
  patch: getRoute(MethodType.Patch)
};

export const Controller = (path: string) => {
  return (target: any) => {
    if (!Array.isArray(classMethods[target.name])) return;
    for (const classMethod of classMethods[target.name]) {
      target[SymbolRoutePrefix] = path;
      Router._DecoratedRouters.set(
        {
          target,
          unless: classMethod.unless,
          ...classMethod.config!
        },
        classMethod.controllers
      );
    }
  };
};

export const Middleware = (convert: (...args: any[]) => Promise<any>) => {
  return (...args: any[]) => Decorate(args, convert);
};

export const Required = (rules: IRequiredConfig) => {
  return (...args: any[]) => {
    return Decorate(args, async (ctx: Context, next: Function) => {
      const method = ctx.method.toLowerCase();
      // Skip checking for graphql
      if (!ctx.graphql) {
        if (rules.params) {
          rules.params = isArray(rules.params);
          for (const name of rules.params) {
            if (!ctx.params[name])
              ctx.throw(412, `${method} Request params: ${name} required`);
          }
        }
        if (rules.query) {
          rules.query = isArray(rules.query);
          for (const name of rules.query) {
            if (!ctx.query[name])
              ctx.throw(412, `${method} Request query: ${name} required`);
          }
        }
        if (rules.body) {
          const req = ctx.request.body;
          if (!req) {
            ctx.throw(412, `${method} Request body are required`);
          } else if (typeof req === 'object') {
            for (const name of Object.keys(rules.body)) {
              if (!req[name])
                ctx.throw(412, `${method} Request body: ${name} required`);
              if (typeof req[name] != rules.body[name])
                ctx.throw(
                  412,
                  `${method} Request body: ${name} is ${rules.body[name]}`
                );
            }
          }
        }
      }
      await next();
    });
  };
};

interface IMethodOptions {
  name: string;
  target: any;
  controllers: any;
  config?: IRouterConfig;
  unless?: boolean;
}

interface IClassMethodMap {
  [key: string]: IMethodOptions[];
}

export interface IRouterConfig {
  method: MethodType;
  path: string;
  unless?: boolean;
}

export interface IRequiredConfig {
  params?: string | string[];
  query?: string | string[];
  body?: any;
}

interface IRouteOptions {
  path: string;
  unless?: boolean;
}
