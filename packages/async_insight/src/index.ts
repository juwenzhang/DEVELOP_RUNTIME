import { AsyncInsight } from './AsyncInsight';
import { DEFAULT_CONFIG, EVENTS, AsyncInsightOptions, ResourceInfo, RequestContext } from './constants';
import { metrics, register, initMetrics } from './metrics/index';
import logger from './utils/logger';
import { ContextUtils } from './utils/context';
import { ExpressAdapter, KoaAdapter, FastifyAdapter } from './adapters';
const asyncInsight = AsyncInsight.getInstance();
export { AsyncInsight };
export default asyncInsight;

export {
    DEFAULT_CONFIG,
    EVENTS,
    
    AsyncInsightOptions,
    ResourceInfo,
    RequestContext,
    
    metrics,
    register,
    initMetrics,
    
    logger,
    ContextUtils,
    
    ExpressAdapter,
    KoaAdapter,
    FastifyAdapter
};

export function createAsyncInsight(options?: AsyncInsightOptions): AsyncInsight {
    console.warn('createAsyncInsight is deprecated. Use AsyncInsight.getInstance() instead.');
    return AsyncInsight.getInstance(options);
}
