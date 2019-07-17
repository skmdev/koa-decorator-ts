"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const koa_router_1 = __importDefault(require("koa-router"));
const glob_1 = __importDefault(require("glob"));
const setMeta_1 = __importDefault(require("../middlewares/setMeta"));
const utils_1 = require("../utils");
exports.SymbolRoutePrefix = Symbol('routePrefix');
class Router extends koa_router_1.default {
    constructor(opt) {
        super(opt);
        this.dir = opt.dir;
    }
    routes() {
        glob_1.default
            .sync(path_1.default.join(this.dir, './*.[t|j]s'))
            .forEach((item) => require(item));
        const cloneMap = new Map(Router._DecoratedRouters);
        Router._DecoratedRouters = new Map();
        /**
         *  Sort by
         *  1. with `:`
         *  2. priority
         */
        const sortedRoute = [...cloneMap]
            .sort((a, b) => Number(a[0].path.indexOf(':')) - Number(b[0].path.indexOf(':')))
            .sort((a, b) => b[0].priority - a[0].priority);
        for (const [config, controller] of sortedRoute) {
            const controllers = utils_1.toArray(controller);
            let prefixPath = config.target[exports.SymbolRoutePrefix];
            prefixPath = utils_1.normalizePath(prefixPath);
            const routerPath = `${prefixPath}${config.path}` || '/';
            this[config.method](routerPath, setMeta_1.default(config.meta), ...controllers);
        }
        return super.routes();
    }
}
Router._DecoratedRouters = new Map();
var MethodType;
(function (MethodType) {
    MethodType["All"] = "all";
    MethodType["Get"] = "get";
    MethodType["Put"] = "put";
    MethodType["Post"] = "post";
    MethodType["Del"] = "del";
    MethodType["Delete"] = "delete";
    MethodType["Patch"] = "patch";
    MethodType["Head"] = "head";
    MethodType["Options"] = "options";
})(MethodType = exports.MethodType || (exports.MethodType = {}));
exports.default = Router;
//# sourceMappingURL=index.js.map