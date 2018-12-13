import path from 'path';
import { Context, Middleware } from 'koa';
import KoaRouter from 'koa-router';
import glob from 'glob';
import KoaJwt from 'koa-jwt';
import { isArray, normalizePath } from '../utils';

export const SymbolRoutePrefix = Symbol('routePrefix');

class Router extends KoaRouter {
  private dir: IRouterConfig['dir'];
  private jwtOptions: IRouterConfig['jwt'];

  private unlessPath: (string | RegExp)[] = [];

  static _DecoratedRouters: Map<
    {
      target: any;
      method: MethodType;
      path: string;
      unless: boolean;
      priority: number;
    },
    Middleware[]
  > = new Map();

  constructor(opt: IRouterConfig) {
    super(opt);
    this.dir = opt.dir;
    if (opt.jwt) {
      const { unless, ...options } = opt.jwt;
      this.jwtOptions = options;
      if (unless) {
        this.unlessPath = unless;
      }
    }
  }

  private pathToRegexp(path: string): RegExp {
    return new RegExp(path.replace(/:\w+/g, '[^/]+'));
  }

  public unless() {
    const { path } = this.stack[this.stack.length - 1];
    this.unlessPath.push(this.pathToRegexp(path));
  }

  public routes() {
    glob
      .sync(path.join(this.dir, './*.js'))
      .forEach((item: string) => require(item));
    glob
      .sync(path.join(this.dir, './*.ts'))
      .forEach((item: string) => require(item));

    const cloneMap = new Map(Router._DecoratedRouters);
    Router._DecoratedRouters = new Map();

    const sortedPriority = [...cloneMap].sort(
      (a, b) => b[0].priority - a[0].priority
    );

    let CheckJwtMiddleware;
    if (this.jwtOptions) {
      CheckJwtMiddleware = KoaJwt(this.jwtOptions).unless({
        path: this.unlessPath,
      });
    }

    for (const [config, controller] of sortedPriority) {
      const controllers = isArray(controller);
      let prefixPath = config.target[SymbolRoutePrefix];

      if (prefixPath) {
        prefixPath = normalizePath(prefixPath);
      }

      const routerPath = `${prefixPath}${config.path}`;

      if (!config.unless && CheckJwtMiddleware) {
        controllers.unshift(CheckJwtMiddleware);
      }

      this[config.method](routerPath, ...controllers);
    }
    return super.routes();
  }
}

export interface JwtOptions extends KoaJwt.Options {
  unless?: (RegExp | string)[];
  getToken?(ctx: KoaJwt.Options | Context): string;
}

export interface IRouterConfig extends KoaRouter.IRouterOptions {
  dir: string;
  jwt?: JwtOptions;
}

export enum MethodType {
  All = 'all',
  Get = 'get',
  Put = 'put',
  Post = 'post',
  Del = 'del',
  Delete = 'delete',
  Patch = 'patch',
  Head = 'head',
  Options = 'options',
}

interface Router {
  /**
     * HTTP get method
     */
  get(
    name: string,
    path: string | RegExp,
    ...middleware: Array<KoaRouter.IMiddleware>
  ): Router;
  get(
    path: string | RegExp,
    ...middleware: Array<KoaRouter.IMiddleware>
  ): Router;

  /**
     * HTTP post method
     */
  post(
    name: string,
    path: string | RegExp,
    ...middleware: Array<KoaRouter.IMiddleware>
  ): Router;
  post(
    path: string | RegExp,
    ...middleware: Array<KoaRouter.IMiddleware>
  ): Router;

  /**
     * HTTP put method
     */
  put(
    name: string,
    path: string | RegExp,
    ...middleware: Array<KoaRouter.IMiddleware>
  ): Router;
  put(
    path: string | RegExp,
    ...middleware: Array<KoaRouter.IMiddleware>
  ): Router;

  /**
     * HTTP delete method
     */
  delete(
    name: string,
    path: string | RegExp,
    ...middleware: Array<KoaRouter.IMiddleware>
  ): Router;
  delete(
    path: string | RegExp,
    ...middleware: Array<KoaRouter.IMiddleware>
  ): Router;

  /**
     * Alias for `router.delete()` because delete is a reserved word
     */
  del(
    name: string,
    path: string | RegExp,
    ...middleware: Array<KoaRouter.IMiddleware>
  ): Router;
  del(
    path: string | RegExp,
    ...middleware: Array<KoaRouter.IMiddleware>
  ): Router;

  /**
     * HTTP head method
     */
  head(
    name: string,
    path: string | RegExp,
    ...middleware: Array<KoaRouter.IMiddleware>
  ): Router;
  head(
    path: string | RegExp,
    ...middleware: Array<KoaRouter.IMiddleware>
  ): Router;

  /**
     * HTTP options method
     */
  options(
    name: string,
    path: string | RegExp,
    ...middleware: Array<KoaRouter.IMiddleware>
  ): Router;
  options(
    path: string | RegExp,
    ...middleware: Array<KoaRouter.IMiddleware>
  ): Router;

  /**
     * HTTP path method
     */
  patch(
    name: string,
    path: string | RegExp,
    ...middleware: Array<KoaRouter.IMiddleware>
  ): Router;
  patch(
    path: string | RegExp,
    ...middleware: Array<KoaRouter.IMiddleware>
  ): Router;

  /**
     * Register route with all methods.
     */
  all(
    name: string,
    path: string | RegExp,
    ...middleware: Array<KoaRouter.IMiddleware>
  ): Router;
  all(
    path: string | RegExp,
    ...middleware: Array<KoaRouter.IMiddleware>
  ): Router;
}

export default Router;
