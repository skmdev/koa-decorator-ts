import * as Koa from 'koa';
import Router, { SymbolRoutePrefix } from '../router';
import { normalizePath, isArray, Decorate } from '../utils';

let requestID = 0;
const classMethods: Json = {};

declare module 'koa' {
    interface Request {
        body: any;
    }
}

export interface RequiredBody {
    [key: string]: string;
}

export interface RouterConfig {
    method: string;
    path: string;
}

export interface RequiredConfig {
    params?: string | string[];
    query?: string | string[];
    body?: RequiredBody;
}

export const route = (config: RouterConfig): Function => {
    return (target: any, name: string, value: ParameterDecorator) => {
        config.path = normalizePath(config.path);
        if (!Array.isArray(classMethods[target])) {
            classMethods[target.name] = [];
        }
        classMethods[target.name].push({ target, config, controllers: target[name] });
    };
};

export const get = (path: string) => {
    return route({
        method: 'get',
        path: path
    });
};

export const post = (path: string) => {
    return route({
        method: 'post',
        path: path
    });
};

export const put = (path: string) => {
    return route({
        method: 'put',
        path: path
    });
};

export const del = (path: string) => {
    return route({
        method: 'delete',
        path: path
    });
};

export const controller = (path: string): Function => {
    return (target: any) => {
        console.log(target);
        for (let i = 0; i < classMethods[target.name].length; i++) {
            const classMethod = classMethods[target.name][i];
            target[SymbolRoutePrefix] = path;
            Router._DecoratedRouters.set({
                target,
                ...classMethod.config
            }, classMethod.controllers);
        }
    };
};

export const middleware = (convert: (...args: any[]) => Promise<any>) => {
    return (...args: any[]) => Decorate(args, convert);
};

export const required = (rules: RequiredConfig) => {
    return (...args: any[]) => {
        return Decorate(
            args,
            async (ctx: Koa.Context, next: any) => {
                const method = (ctx.method).toLowerCase();
                switch (method) {
                    case 'put':
                    case 'delete':
                        if (rules.params) {
                            rules.params = isArray(rules.params);
                            for (const name of rules.params) {
                                if (!ctx.params[name]) ctx.throw(412, `${method} Request params: ${name} required`);
                            }
                        }
                    case 'get':
                        if (rules.query) {
                            rules.query = isArray(rules.query);
                            for (const name of rules.query) {
                                if (!ctx.query[name]) ctx.throw(412, `${method} Request query: ${name} required`);
                            }
                        }
                        break;
                    case 'post':
                        if (rules.body) {
                            const req = ctx.request.body;
                            if (!req) {
                                ctx.throw(412, `${method} request body are required`);
                            }
                            for (const name of Object.keys(rules.body)) {
                                if (!req[name]) ctx.throw(412, `${method} request body: ${name} required`);
                                if (typeof req[name] != rules.body[name]) ctx.throw(412, `${method} request body: ${name} is ${rules.body[name]}`);
                            }
                        }
                        break;
                    default:
                        console.log(`${method} Request`);
                }
                await next();
            });
    };
};