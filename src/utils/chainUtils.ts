import { Bucketchain } from 'superchain';
import { ConductorWorkerChainBaseContext, ConductorWorkerChainContext } from '../ConductorWorker';

export interface SuperChainChainContext<
  OUTPUT,
  INPUT,
  CTX extends ConductorWorkerChainBaseContext<OUTPUT, INPUT> = ConductorWorkerChainContext<OUTPUT, INPUT>,
> {
  _taskCtx: CTX;
  (_ctx: any, next: any): Promise<void>;
}

export function getTaskCtx<
  OUTPUT,
  INPUT,
  CTX extends ConductorWorkerChainBaseContext<OUTPUT, INPUT> = ConductorWorkerChainContext<OUTPUT, INPUT>,
  ChainCTX extends { _taskCtx: CTX } = SuperChainChainContext<OUTPUT, INPUT, CTX>,
>(chainCtx: ChainCTX): CTX {
  return chainCtx._taskCtx;
}

export function setTaskCtx<
  OUTPUT,
  INPUT,
  CTX extends ConductorWorkerChainBaseContext<OUTPUT, INPUT> = ConductorWorkerChainContext<OUTPUT, INPUT>,
  ChainCTX extends { _taskCtx: CTX } = SuperChainChainContext<OUTPUT, INPUT, CTX>,
>(chainCtx: ChainCTX, taskCtx: CTX) {
  chainCtx._taskCtx = taskCtx;
}

export function initPreChainMiddleware(bucketChain: Bucketchain) {
  const __preChain = bucketChain.bucket('pre');
  __preChain.add(async function (ctx: any, next: any) {
    // @ts-ignore
    setTaskCtx(this, ctx);
    next();
  });
  return __preChain;
}
