"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toArray = (arr) => {
    return Array.isArray(arr) ? arr : [arr];
};
exports.normalizePath = (path) => {
    if (!path.startsWith('/')) {
        path = `/${path}`;
    }
    if (path.endsWith('/')) {
        path = path.slice(0, -1);
    }
    return path;
};
exports.Decorate = (args, middleware) => {
    const [target, name, descriptor] = args;
    target[name] = exports.toArray(target[name]);
    target[name].unshift(middleware);
    return descriptor;
};
//# sourceMappingURL=index.js.map