import { Middleware } from 'koa';
import KoaRouter from 'koa-router';
export declare const SymbolRoutePrefix: unique symbol;
declare class Router extends KoaRouter {
    private dir;
    static _DecoratedRouters: Map<DecoratedRoutersMapKey, Middleware[]>;
    constructor(opt: RouterConfig);
    routes(): any;
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
export declare enum MethodType {
    All = "all",
    Get = "get",
    Put = "put",
    Post = "post",
    Del = "del",
    Delete = "delete",
    Patch = "patch",
    Head = "head",
    Options = "options"
}
export default Router;
