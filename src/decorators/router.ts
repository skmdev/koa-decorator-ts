import Router, { SymbolRoutePrefix, MethodType } from '../router';
import { normalizePath, Decorate } from '../utils';
import { Context } from 'koa';
import { Validator, Schema } from 'jsonschema';

const v = new Validator();
const classMethods: ClassMethodMap = {};

function updateMethodOptions(target: any, name: string, options: any) {
  const className = target.name || target.constructor.name;
  if (!Array.isArray(classMethods[className])) {
    classMethods[className] = [];
  }

  const method = classMethods[className].find(
    (methodOptions) => methodOptions.name === name
  );

  for (const key in options) {
    if (method && typeof options[key] !== 'undefined') {
      method[key as keyof MethodOptions] = options[key];
    }
  }

  if (!method) {
    classMethods[className].push({
      name,
      target,
      controllers: target[name],
      meta: {},
      ...options,
    });
  }
}

export const Priority = (priority: number): Function => (
  target: any,
  name: string
) => {
  updateMethodOptions(target, name, { priority });
};

export const Meta = (meta: any): Function => (target: any, name: string) => {
  updateMethodOptions(target, name, { meta });
};

const route = (config: RouteConfig): Function => {
  return (target: any, name: string) => {
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
  patch: getRoute(MethodType.Patch),
  all: getRoute(MethodType.All),
};

export const Controller = (path: string = '') => {
  return (target: any) => {
    if (!Array.isArray(classMethods[target.name])) return;
    for (const classMethod of classMethods[target.name]) {
      target[SymbolRoutePrefix] = path;
      Router._DecoratedRouters.set(
        {
          target,
          priority: classMethod.priority || 0,
          meta: classMethod.meta,
          ...classMethod.config!,
        },
        classMethod.controllers
      );
    }
  };
};

export const Middleware = (convert: (...args: any[]) => Promise<any>) => {
  return (...args: any[]) => Decorate(args, convert);
};

export const Required = (rules: RequiredConfig) => {
  return (...args: any[]) => {
    return Decorate(args, async (ctx: Context, next: Function) => {
      const method = ctx.method.toLowerCase();
      // Skip checking for graphql
      if (!ctx.graphql) {
        if (rules.query) {
          const validateResult = v.validate(ctx.query, rules.query);
          if (!validateResult.valid) {
            ctx.throw(
              412,
              `${method} Request query: ${validateResult.errors[0].message}`
            );
          }
        }

        if (rules.body) {
          const validateResult = v.validate(ctx.request.body, rules.body);
          if (!validateResult.valid) {
            ctx.throw(
              412,
              `${method} Request body: ${validateResult.errors[0].message}`
            );
          }
        }
      }
      await next();
    });
  };
};

interface MethodOptions {
  name: string;
  target: any;
  controllers: any;
  config?: RouteConfig;
  priority?: number;
  meta: any;
}

interface ClassMethodMap {
  [key: string]: MethodOptions[];
}

export interface RouteConfig {
  method: MethodType;
  path: string;
}

export interface RequiredConfig {
  params?: Schema;
  query?: Schema;
  body?: Schema;
}
