"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const koa_compose_1 = __importDefault(require("koa-compose"));
const utils_1 = require("../utils");
exports.Graphql = (target, name, descriptor) => {
    const middleware = utils_1.toArray(target[name]);
    descriptor.value = (root, args, context, info) => __awaiter(this, void 0, void 0, function* () {
        context.graphql = {
            root,
            args,
            info,
            body: context.graphql ? context.graphql.body : {},
        };
        if (Object.keys(context.graphql.body).length === 0) {
            Object.defineProperty(context, 'body', {
                get: function () {
                    return this.graphql.body[key];
                },
                set: function (v) {
                    this.graphql.body[this.graphql.info.path.key] = v;
                },
            });
        }
        const key = context.graphql.info.path.key;
        yield koa_compose_1.default(middleware)(context);
        return context.graphql.body[key];
    });
};
//# sourceMappingURL=graphql.js.map