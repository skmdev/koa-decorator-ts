import path from 'path';
import Koa from 'koa';
import KoaRouter from 'koa-router';
import glob from 'glob';

import { isArray, normalizePath } from '../utils';

export interface RouteConfig {
    app: Koa;
    apiDirPath: string;
}

export const SymbolRoutePrefix = Symbol('routePrefix');

class Router {

    private app: Koa;

    private apiDirPath: string;

    private router: any;

    static _DecoratedRouters:
        Map<{target: any, method: string, path: string}, Function | Function[]> = new Map();

    constructor(opt: RouteConfig) {
        this.app = opt.app;
        this.apiDirPath = opt.apiDirPath;
        this.router = new KoaRouter();
    }

    public registerRouters() {
        glob.sync(path.join(this.apiDirPath, './*.js')).forEach((item: string) => require(item));
        glob.sync(path.join(this.apiDirPath, './*.ts')).forEach((item: string) => require(item));

        for (const [config, controller] of Router._DecoratedRouters) {
            const controllers = isArray(controller);
            let prefixPath = config.target[SymbolRoutePrefix];
            if (prefixPath) {
                prefixPath = normalizePath(prefixPath);
            }
            // const routerPath = config.path;
            const routerPath = `${prefixPath}${config.path}`;
            console.log(config.method, routerPath);

            this.router[config.method](routerPath, ...controllers);
        }
        this.app.use(this.router.routes());
        this.app.use(this.router.allowedMethods());
    }

}

export default Router;