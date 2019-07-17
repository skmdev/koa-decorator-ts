import path from 'path';
import { Middleware } from 'koa';
import KoaRouter from 'koa-router';
import glob from 'glob';

import setMeta from '../middlewares/setMeta';
import { toArray, normalizePath } from '../utils';

export const SymbolRoutePrefix = Symbol('routePrefix');

class Router extends KoaRouter {
  private dir: RouterConfig['dir'];

  static _DecoratedRouters: Map<
    DecoratedRoutersMapKey,
    Middleware[]
  > = new Map();

  constructor(opt: RouterConfig) {
    super(opt);
    this.dir = opt.dir;
  }

  public routes() {
    glob
      .sync(path.join(this.dir, './*.[t|j]s'))
      .forEach((item: string) => require(item));

    const cloneMap = new Map(Router._DecoratedRouters);
    Router._DecoratedRouters = new Map();

    /**
     *  Sort by
     *  1. with `:`
     *  2. priority
     */
    const sortedRoute = [...cloneMap]
      .sort(
        (a, b) =>
          Number(a[0].path.indexOf(':')) - Number(b[0].path.indexOf(':'))
      )
      .sort((a, b) => b[0].priority - a[0].priority);

    for (const [config, controller] of sortedRoute) {
      const controllers = toArray(controller);
      let prefixPath = config.target[SymbolRoutePrefix];

      prefixPath = normalizePath(prefixPath);

      const routerPath = `${prefixPath}${config.path}` || '/';

      this[config.method](routerPath, setMeta(config.meta), ...controllers);
    }
    return super.routes();
  }
}

interface DecoratedRoutersMapKey {
  target: any;
  method: MethodType;
  path: string;
  priority: number;
  meta: any;
}

export interface RouterConfig extends KoaRouter.IRouterOptions {
  dir: string;
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

export default Router;
