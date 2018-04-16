import path from 'path';
import Koa from 'koa';
import KoaRouter from 'koa-router';
import glob from 'glob';
import KoaJwt from 'koa-jwt';
import { isArray, normalizePath } from '../utils';

export interface RouteConfig {
  app: Koa;
  apiDirPath: string;
  jwt?: KoaJwt.Options;
}

export const SymbolRoutePrefix = Symbol('routePrefix');

class Router {
  private app: Koa;

  private apiDirPath: string;
  private router: any;
  private jwtOptions: RouteConfig['jwt'];

  static _DecoratedRouters: Map<
    { target: any; method: string; path: string; unless?: boolean },
    Function | Function[]
  > = new Map();

  constructor(opt: RouteConfig) {
    this.app = opt.app;
    this.apiDirPath = opt.apiDirPath;
    this.router = new KoaRouter();
    this.jwtOptions = opt.jwt;
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
      this.app.use(KoaJwt(this.jwtOptions).unless({ path: unlessPath }));
    }

    this.app.use(this.router.routes());
    this.app.use(this.router.allowedMethods());
  }
}

export default Router;
