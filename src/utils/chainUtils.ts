import { Bucketchain } from 'superchain';

export function getTaskCtx(chainCtx: any) {
  return chainCtx._taskCtx;
}

export function setTaskCtx(chainCtx: any, taskCtx: any) {
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
