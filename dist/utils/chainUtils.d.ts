import { Bucketchain } from 'superchain';
import { ConductorWorkerChainBaseContext, ConductorWorkerChainContext } from '../ConductorWorker';
export interface SuperChainChainContext<OUTPUT, INPUT, CTX extends ConductorWorkerChainBaseContext<OUTPUT, INPUT> = ConductorWorkerChainContext<OUTPUT, INPUT>> {
    _taskCtx: CTX;
    (_ctx: any, next: any): Promise<void>;
}
export declare function getTaskCtx<OUTPUT, INPUT, CTX extends ConductorWorkerChainBaseContext<OUTPUT, INPUT> = ConductorWorkerChainContext<OUTPUT, INPUT>, ChainCTX extends {
    _taskCtx: CTX;
} = SuperChainChainContext<OUTPUT, INPUT, CTX>>(chainCtx: ChainCTX): CTX;
export declare function setTaskCtx<OUTPUT, INPUT, CTX extends ConductorWorkerChainBaseContext<OUTPUT, INPUT> = ConductorWorkerChainContext<OUTPUT, INPUT>, ChainCTX extends {
    _taskCtx: CTX;
} = SuperChainChainContext<OUTPUT, INPUT, CTX>>(chainCtx: ChainCTX, taskCtx: CTX): void;
export declare function initPreChainMiddleware(bucketChain: Bucketchain): any;
