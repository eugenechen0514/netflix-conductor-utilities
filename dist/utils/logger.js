"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.error = exports.debug = exports.base = void 0;
const debug_1 = __importDefault(require("debug"));
exports.base = (0, debug_1.default)('netflix-conductor-utilities');
exports.debug = exports.base.extend('debug');
exports.error = exports.base.extend('error');
//# sourceMappingURL=logger.js.map