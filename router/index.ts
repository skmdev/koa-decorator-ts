import path from 'path';
import Koa from 'koa';
import KoaRouter from 'koa-router';
import glob from 'glob';
import KoaJwt from 'koa-jwt';
import { isArray, normalizePath } from '../utils';

export interface RouterConfig {
  app: Koa;
  apiDirPath: string;
  jwt?: KoaJwt.Options;
  graphql?: {
    path: string;
    controller: any;
    unless?: boolean;
  };
}

export const SymbolRoutePrefix = Symbol('routePrefix');

class Router {
  private app: RouterConfig['app'];
  private apiDirPath: RouterConfig['apiDirPath'];
  private jwtOptions: RouterConfig['jwt'];
  private graphql: RouterConfig['graphql'];

  private router: any;

  static _DecoratedRouters: Map<
    { target: any; method: string; path: string; unless?: boolean },
    Function | Function[]
  > = new Map();

  constructor(opt: RouterConfig) {
    this.app = opt.app;
    this.apiDirPath = opt.apiDirPath;
    this.router = new KoaRouter();

    this.jwtOptions = opt.jwt;
    this.graphql = opt.graphql;
  }

  public registerRouters() {
    glob.sync(path.join(this.apiDirPath, './*.js')).forEach((item: string) => require(item));
    glob.sync(path.join(this.apiDirPath, './*.ts')).forEach((item: string) => require(item));

    const unlessPath: (string | RegExp)[] = [];

    for (const [ config, controller ] of Router._DecoratedRouters) {
      const controllers = isArray(controller);
      let prefixPath = config.target[SymbolRoutePrefix];
      if (prefixPath) {
        prefixPath = normalizePath(prefixPath);
      }
      const routerPath = `${prefixPath}${config.path}`;

      if (config.unless) {
        const pathRegex = routerPath.replace(/:\w+/g, '[^/]+');
        unlessPath.push(new RegExp(pathRegex));
      }

      this.router[config.method](routerPath, ...controllers);
    }

    if (this.jwtOptions) {
      if (this.graphql && this.graphql.unless) {
        unlessPath.push(this.graphql.path);
      }
      this.app.use(KoaJwt(this.jwtOptions).unless({ path: unlessPath }));
    }

    if (this.graphql) {
      this.router.all(this.graphql.path, this.graphql.controller);
    }

    this.app.use(this.router.routes());
    this.app.use(this.router.allowedMethods());
  }
}

export default Router;
