import path from 'path';
import Koa from 'koa';
import KoaRouter from 'koa-router';
import glob from 'glob';
import KoaJwt from 'koa-jwt';
import { isArray, normalizePath } from '../utils';

export const SymbolRoutePrefix = Symbol('routePrefix');

export interface JwtOptions extends KoaJwt.Options {
  getToken?(ctx: KoaJwt.Options | Koa.Context): string;
}

export interface IRouterConfig extends KoaRouter.IRouterOptions {
  app: Koa;
  apiDirPath: string;
  jwt?: JwtOptions;
}

interface Router {
  [key: string]: any;

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

class Router extends KoaRouter {
  private app: IRouterConfig['app'];
  private apiDirPath: IRouterConfig['apiDirPath'];
  private jwtOptions: IRouterConfig['jwt'];

  private unlessPath: (string | RegExp)[] = [];

  static _DecoratedRouters: Map<
    { target: any; method: string; path: string; unless?: boolean },
    Function | Function[]
  > = new Map();

  constructor(opt: IRouterConfig) {
    super(opt);
    this.app = opt.app;
    this.apiDirPath = opt.apiDirPath;
    this.jwtOptions = opt.jwt;
  }

  private pathToRegexp(path: string): RegExp {
    return new RegExp(path.replace(/:\w+/g, '[^/]+'));
  }

  public unless() {
    const { path } = this.stack[this.stack.length - 1];
    this.unlessPath.push(this.pathToRegexp(path));
  }

  public registerRouters() {
    glob
      .sync(path.join(this.apiDirPath, './*.js'))
      .forEach((item: string) => require(item));
    glob
      .sync(path.join(this.apiDirPath, './*.ts'))
      .forEach((item: string) => require(item));
    for (const [config, controller] of Router._DecoratedRouters) {
      const controllers = isArray(controller);
      let prefixPath = config.target[SymbolRoutePrefix];
      if (prefixPath) {
        prefixPath = normalizePath(prefixPath);
      }
      const routerPath = `${prefixPath}${config.path}`;

      if (config.unless) {
        this.unlessPath.push(this.pathToRegexp(routerPath));
      }

      this[config.method](routerPath, ...controllers);
    }
    if (this.jwtOptions) {
      this.app.use(KoaJwt(this.jwtOptions).unless({ path: this.unlessPath }));
    }

    this.app.use(this.routes());
    this.app.use(this.allowedMethods());
  }
}

export default Router;
