// TODO: 判断是否是浏览器环境吧
export const isBrowser = typeof window !== 'undefined' 
    && typeof window.Blob !== 'undefined';

// TODO: 判断是否是nodes环境吧
export const isNode = typeof process !== 'undefined' 
    && typeof process.versions !== null 
    && typeof process.versions.node !== null;

// TODO: 判断是否是web worker环境吧
export const isWebWorker = typeof self !== 'undefined' 
    && typeof self.Blob !== 'undefined';

// TODO: 判断是否是service worker环境吧
export const isServiceWorker = typeof self !== 'undefined'
    && typeof self.constructor.name === 'string'
    && self.constructor.name === 'ServiceWorkerGlobalScope'
    && 'registration' in self
    && typeof self.registration !== 'undefined';

// TODO: 判断是否是shared worker环境吧
export const isSharedWorker = typeof self !== 'undefined'
    && typeof self.constructor.name === 'string'
    && self.constructor.name === 'SharedWorkerGlobalScope'
    && 'port' in self
    && typeof self.port !== 'undefined';

// TODO 获取得到当前的 Blob 构造函数的实现吧
export const getBlobConstructor: () => typeof Blob = () => {
    if (isBrowser) {
        return window.Blob
    }
    if (isNode) {
        return require('buffer').Blob
    }
    if (isWebWorker) {
        return self.Blob
    }
    if (isServiceWorker) {
        return 'registration' in self 
            ? (self as any).registration.Blob 
            : self.Blob
    }
    if (isSharedWorker) {
        return 'port' in self 
            ? (self as any).port.Blob 
            : self.Blob
    }
    throw new Error('获取不到 Blob 构造函数，😁😁')
}
