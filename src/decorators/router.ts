import Router, { SymbolRoutePrefix, MethodType } from '../router';
import { normalizePath, Decorate } from '../utils';
import { Context } from 'koa';
import { Validator, Schema } from 'jsonschema';
import { getFromContainer, MetadataStorage } from 'class-validator';
import { validationMetadatasToSchemas } from 'class-validator-jsonschema';
import { SchemaObject } from 'openapi3-ts';

const VALIDATOR = new Validator();
const CLASS_METHODS: ClassMethodMap = {};
const SCHEMA_CACHE: Record<string, SchemaObject> = {};

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

const getRoute = (method: MethodType) => (path: string = '/') =>
  route({ method, path });

export const Route = {
  get: getRoute(MethodType.Get),
  post: getRoute(MethodType.Post),
  put: getRoute(MethodType.Put),
  del: getRoute(MethodType.Delete),
  patch: getRoute(MethodType.Patch),
  all: getRoute(MethodType.All),
};

export const Controller = (path: string = '') => (target: any) => {
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

export const Middleware = (convert: (...args: any[]) => Promise<any>) => (
  ...args: any[]
) => Decorate(args, convert);

const validateAndThrow = (
  type: 'query' | 'body',
  ctx: Context,
  data: any,
  schema: Schema
) => {
  const validateResult = VALIDATOR.validate(data, schema, {
    propertyName: type,
  });
  if (!validateResult.valid) {
    ctx.throw(
      412,
      `${type} validation error: ${validateResult.errors
        .map(e => `${e.property.replace(`${type}.`, '')} ${e.message}`)
        .join(', ')}`,
      validateResult.errors
    );
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

const GetSchemaFromType = (Type: new () => any) => {
  const { name } = Type;
  const cached = SCHEMA_CACHE[name];
  if (cached) {
    return cached;
  }
  const metadatas = (getFromContainer(MetadataStorage) as any)
    .validationMetadatas;
  const allSchemas = validationMetadatasToSchemas(metadatas);
  const schema = allSchemas[name];
  if (!schema) {
    console.error(`No schema found for ${name}`);
  } else {
    SCHEMA_CACHE[name] = schema;
  }
  return schema;
};

export const RequiredBody = (Type: new () => any) =>
  RequiredDecorator({
    body: GetSchemaFromType(Type),
  });

export const RequiredQuery = (Type: new () => any) =>
  RequiredDecorator({
    query: GetSchemaFromType(Type),
  });

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
