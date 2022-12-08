"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initPreChainMiddleware = exports.setTaskCtx = exports.getTaskCtx = void 0;
function getTaskCtx(chainCtx) {
    return chainCtx._taskCtx;
}
exports.getTaskCtx = getTaskCtx;
function setTaskCtx(chainCtx, taskCtx) {
    chainCtx._taskCtx = taskCtx;
}
exports.setTaskCtx = setTaskCtx;
function initPreChainMiddleware(bucketChain) {
    const __preChain = bucketChain.bucket('pre');
    __preChain.add(function (ctx, next) {
        return __awaiter(this, void 0, void 0, function* () {
            // @ts-ignore
            setTaskCtx(this, ctx);
            next();
        });
    });
    return __preChain;
}
exports.initPreChainMiddleware = initPreChainMiddleware;
//# sourceMappingURL=chainUtils.js.map