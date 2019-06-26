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

      const routerPath = `${prefixPath}${config.path}` || '/'

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

// interface Router {
//   /**
//      * HTTP get method
//      */
//   get(
//     name: string,
//     path: string | RegExp,
//     ...middleware: Array<KoaRouter.IMiddleware>
//   ): Router;
//   get(
//     path: string | RegExp,
//     ...middleware: Array<KoaRouter.IMiddleware>
//   ): Router;

//   /**
//      * HTTP post method
//      */
//   post(
//     name: string,
//     path: string | RegExp,
//     ...middleware: Array<KoaRouter.IMiddleware>
//   ): Router;
//   post(
//     path: string | RegExp,
//     ...middleware: Array<KoaRouter.IMiddleware>
//   ): Router;

//   /**
//      * HTTP put method
//      */
//   put(
//     name: string,
//     path: string | RegExp,
//     ...middleware: Array<KoaRouter.IMiddleware>
//   ): Router;
//   put(
//     path: string | RegExp,
//     ...middleware: Array<KoaRouter.IMiddleware>
//   ): Router;

//   /**
//      * HTTP delete method
//      */
//   delete(
//     name: string,
//     path: string | RegExp,
//     ...middleware: Array<KoaRouter.IMiddleware>
//   ): Router;
//   delete(
//     path: string | RegExp,
//     ...middleware: Array<KoaRouter.IMiddleware>
//   ): Router;

//   /**
//      * Alias for `router.delete()` because delete is a reserved word
//      */
//   del(
//     name: string,
//     path: string | RegExp,
//     ...middleware: Array<KoaRouter.IMiddleware>
//   ): Router;
//   del(
//     path: string | RegExp,
//     ...middleware: Array<KoaRouter.IMiddleware>
//   ): Router;

//   /**
//      * HTTP head method
//      */
//   head(
//     name: string,
//     path: string | RegExp,
//     ...middleware: Array<KoaRouter.IMiddleware>
//   ): Router;
//   head(
//     path: string | RegExp,
//     ...middleware: Array<KoaRouter.IMiddleware>
//   ): Router;

//   /**
//      * HTTP options method
//      */
//   options(
//     name: string,
//     path: string | RegExp,
//     ...middleware: Array<KoaRouter.IMiddleware>
//   ): Router;
//   options(
//     path: string | RegExp,
//     ...middleware: Array<KoaRouter.IMiddleware>
//   ): Router;

//   /**
//      * HTTP path method
//      */
//   patch(
//     name: string,
//     path: string | RegExp,
//     ...middleware: Array<KoaRouter.IMiddleware>
//   ): Router;
//   patch(
//     path: string | RegExp,
//     ...middleware: Array<KoaRouter.IMiddleware>
//   ): Router;

//   /**
//      * Register route with all methods.
//      */
//   all(
//     name: string,
//     path: string | RegExp,
//     ...middleware: Array<KoaRouter.IMiddleware>
//   ): Router;
//   all(
//     path: string | RegExp,
//     ...middleware: Array<KoaRouter.IMiddleware>
//   ): Router;
// }

export default Router;
