"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const router_1 = __importStar(require("../router"));
const utils_1 = require("../utils");
const jsonschema_1 = require("jsonschema");
const v = new jsonschema_1.Validator();
const classMethods = {};
function updateMethodOptions(target, name, options) {
    const className = target.name || target.constructor.name;
    if (!Array.isArray(classMethods[className])) {
        classMethods[className] = [];
    }
    const method = classMethods[className].find(methodOptions => methodOptions.name === name);
    for (const key in options) {
        if (method && typeof options[key] !== 'undefined') {
            method[key] = options[key];
        }
    }
    if (!method) {
        classMethods[className].push(Object.assign({ name,
            target, controllers: target[name], meta: {} }, options));
    }
}
exports.Priority = (priority) => (target, name) => {
    updateMethodOptions(target, name, { priority });
};
exports.Meta = (meta) => (target, name) => {
    updateMethodOptions(target, name, { meta });
};
const route = (config) => (target, name) => {
    config.path = utils_1.normalizePath(config.path);
    updateMethodOptions(target, name, { config });
};
const getRoute = (method) => (path = '/') => route({ method, path });
exports.Route = {
    get: getRoute(router_1.MethodType.Get),
    post: getRoute(router_1.MethodType.Post),
    put: getRoute(router_1.MethodType.Put),
    del: getRoute(router_1.MethodType.Delete),
    patch: getRoute(router_1.MethodType.Patch),
    all: getRoute(router_1.MethodType.All),
};
exports.Controller = (path = '') => (target) => {
    if (!Array.isArray(classMethods[target.name]))
        return;
    for (const classMethod of classMethods[target.name]) {
        target[router_1.SymbolRoutePrefix] = path;
        router_1.default._DecoratedRouters.set(Object.assign({ target, priority: classMethod.priority || 0, meta: classMethod.meta }, classMethod.config), classMethod.controllers);
    }
};
exports.Middleware = (convert) => (...args) => utils_1.Decorate(args, convert);
const validateAndThrow = (type, ctx, data, schema) => {
    const validateResult = v.validate(data, schema, { propertyName: type });
    if (!validateResult.valid) {
        ctx.throw(412, `${type} validation error: ${validateResult.errors
            .map(e => `${e.property.replace(`${type}.`, '')} ${e.message}`)
            .join(', ')}`, validateResult.errors);
    }
};
exports.Required = (rules) => (...args) => utils_1.Decorate(args, (ctx, next) => __awaiter(this, void 0, void 0, function* () {
    // Skip checking for graphql
    if (!ctx.graphql) {
        if (rules.query) {
            validateAndThrow('query', ctx, ctx.query, rules.query);
        }
        if (rules.body) {
            validateAndThrow('body', ctx, ctx.request.body, rules.body);
        }
    }
    yield next();
}));
//# sourceMappingURL=router.js.map