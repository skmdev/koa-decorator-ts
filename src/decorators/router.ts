import Router, { SymbolRoutePrefix, MethodType } from '../router';
import { normalizePath, Decorate } from '../utils';
import { Context } from 'koa';
import { Validator, Schema, ValidationError } from 'jsonschema';
import { transformAndValidate } from 'class-transformer-validator';
import { ValidationError as ClassValidationError } from 'class-validator';

const VALIDATOR = new Validator();
const CLASS_METHODS: ClassMethodMap = {};

function updateMethodOptions(target: any, name: string, options: any) {
  const className = target.name || target.constructor.name;
  if (!Array.isArray(CLASS_METHODS[className])) {
    CLASS_METHODS[className] = [];
  }

  const method = CLASS_METHODS[className].find(
    methodOptions => methodOptions.name === name
  );

  for (const key in options) {
    if (method && typeof options[key] !== 'undefined') {
      method[key as keyof MethodOptions] = options[key];
    }
  }

  if (!method) {
    CLASS_METHODS[className].push({
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

const route = (config: RouteConfig): Function => (
  target: any,
  name: string
) => {
  config.path = normalizePath(config.path!);
  updateMethodOptions(target, name, { config });
};

const getRoute = (method: MethodType) => (path = '/') =>
  route({ method, path });

export const Route = {
  get: getRoute(MethodType.Get),
  post: getRoute(MethodType.Post),
  put: getRoute(MethodType.Put),
  del: getRoute(MethodType.Delete),
  patch: getRoute(MethodType.Patch),
  all: getRoute(MethodType.All),
};

export const Controller = (path = '') => (target: any) => {
  if (!Array.isArray(CLASS_METHODS[target.name])) return;
  for (const classMethod of CLASS_METHODS[target.name]) {
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

const throwValidationErrors = (
  ctx: Context,
  type: ErrorDataType,
  errors: Pick<ValidationError, 'property' | 'message'>[]
) => {
  console.log(errors);
  ctx.throw(
    412,
    `${type} validation error: ${errors
      .map(e => `${e.property.replace(`${type}.`, '')} ${e.message}`)
      .join(', ')}`,
    errors
  );
};

type ErrorDataType = 'query' | 'body';

export const Middleware = (convert: (...args: any[]) => Promise<any>) => (
  ...args: any[]
) => Decorate(args, convert);

const validateAndThrow = (
  type: ErrorDataType,
  ctx: Context,
  data: any,
  schema: Schema
) => {
  const validateResult = VALIDATOR.validate(data, schema, {
    propertyName: type,
  });
  if (!validateResult.valid) {
    throwValidationErrors(ctx, type, validateResult.errors);
  }
};

const RequiredDecorator = (rules: RequiredConfig) => (...args: any[]) =>
  Decorate(args, async (ctx: Context, next: Function) => {
    // Skip checking for graphql
    if (!ctx.graphql) {
      if (rules.query) {
        validateAndThrow('query', ctx, ctx.query, rules.query);
      }
      if (rules.body) {
        validateAndThrow('body', ctx, ctx.request.body, rules.body);
      }
    }
    await next();
  });

const validateClass = (Type: new () => any, type: ErrorDataType) => (
  ...args: any[]
) =>
  Decorate(args, async (ctx: Context, next: Function) => {
    const data = (type == 'body' && ctx.request.body) || ctx.query;
    try {
      await transformAndValidate(Type, data);
    } catch (err) {
      if (Array.isArray(err)) {
        const errors = err as ClassValidationError[];
        throwValidationErrors(
          ctx,
          type,
          errors.map(e => {
            return {
              property: type,
              message:
                (!e.value && `requires property \"${e.property}\"`) ||
                Object.values(e.constraints)[0],
            };
          })
        );
      } else {
        throw err;
      }
    }
    await next();
  });

export const RequiredBody = (Type: new () => any) =>
  validateClass(Type, 'body');

export const RequiredQuery = (Type: new () => any) =>
  validateClass(Type, 'query');

export const Required = (rules: RequiredConfig) => RequiredDecorator(rules);

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
