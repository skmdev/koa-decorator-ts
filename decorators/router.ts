import Router, { SymbolRoutePrefix, MethodType } from '../router';
import { normalizePath, Decorate } from '../utils';
import { Context } from 'koa';
import { Validator, Schema } from 'jsonschema';

const v = new Validator();
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
      ...options,
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

export const Priority = (priority: number): Function => (
  target: any,
  name: string,
  value: ParameterDecorator
) => {
  updateMethodOptions(target, name, { priority });
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
  patch: getRoute(MethodType.Patch),
  all: getRoute(MethodType.All),
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
          priority: classMethod.priority || 0,
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

export const Required = (rules: IRequiredConfig) => {
  return (...args: any[]) => {
    return Decorate(args, async (ctx: Context, next: Function) => {
      const method = ctx.method.toLowerCase();
      // Skip checking for graphql
      if (!ctx.graphql) {
        if (rules.params) {
          const validateResult = v.validate(ctx.params, rules.params);

          if (!validateResult.valid) {
            ctx.throw(
              412,
              `${method} Request params: ${validateResult.errors[0].message}`
            );
          }
        }

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
          // console.log(validateResult.valid, ctx.request.body);
          if (!validateResult.valid) {
            console.log('aa');
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

interface IMethodOptions {
  name: string;
  target: any;
  controllers: any;
  config?: IRouterConfig;
  unless?: boolean;
  priority?: number;
}

interface IClassMethodMap {
  [key: string]: IMethodOptions[];
}

export interface IRouterConfig {
  method: MethodType;
  path: string;
}

export interface IRequiredConfig {
  params?: Schema;
  query?: Schema;
  body?: Schema;
}
