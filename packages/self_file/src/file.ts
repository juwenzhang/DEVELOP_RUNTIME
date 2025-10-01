import { 
    isBrowser, 
    isNode, 
    isWebWorker, 
    isServiceWorker, 
    isSharedWorker,
    getBlobConstructor
} from './environment'
import { UniversalFileOption, FileLike } from './types'

const Blob = getBlobConstructor();

export class SelfFile extends Blob implements FileLike {
    readonly name: string;
    readonly lastModified?: number;
    
    constructor(
        parts: BlobPart[], 
        name: string, 
        options: UniversalFileOption = {}
    ) {
        const blobOptions: BlobPropertyBag = {
            type: options.type || SelfFile.inferMimeType(name),
            ...(isNode && { endings: options.endings || 'transparent' }),
        }
        super(parts, blobOptions);
        this.name = name;
        this.lastModified = options.lastModified ?? Date.now();
    }

    public static inferMimeType(fileName: string) {
        if (isBrowser && 'File' in window) {
            const tempFile = new window.File([], fileName);
            return tempFile.type;
        }

        if (isNode) {
            const ext = fileName.split('.').pop()?.toLowerCase() || '';
            let mimeType: string;
            if ('mime-types' in require('mime-types')) {
                mimeType = require('mime-types').lookup(ext) || '';
            }
            else {
                // 当然这里还有其他的类型文件吧，说不定的呐
                const seleMimeTypesMap: Record<string, string> = {
                    text: 'text/plain',
                    json: 'application/json',
                    png: 'image/png',
                    jpg: 'image/jpeg',
                    jpeg: 'image/jpeg',
                    webp: 'image/webp',
                    pdf: 'application/pdf',
                    html: 'text/html',
                    js: 'text/javascript',
                    css: 'text/css',
                    svg: 'image/svg+xml',
                    xml: 'application/xml',
                    md: 'text/markdown',
                    txt: 'text/plain'
                }
                mimeType = seleMimeTypesMap[ext] || '';
            }
            return mimeType || '';
        }
    }

    override slice(
        start?: number, 
        end?: number, 
        contentType?: string
    ): Blob {
        const blobSlice = super.slice(start, end, contentType);
        return new SelfFile([blobSlice], this.name, {
            lastModified: this.lastModified,
            type: contentType || this.type,
        })
    }

    async toBuffer(): Promise<Buffer> {
        if (!isNode) {
            throw new Error('toBuffer 方法只能在 Node 环境下使用');
        }
        return Buffer.from(await this.arrayBuffer());
    }

    judgeEnvironment() {
        if (!isBrowser && !isNode && !isWebWorker && !isServiceWorker && !isSharedWorker) {
            throw new Error('当前环境不支持 SelfFile');
        }
    }

    toBrowserFile(): File {
        this.judgeEnvironment();
        if (!isBrowser) {
            throw new Error('toBrowserFile 方法只能在浏览器环境下使用');
        }
        return new File([this], this.name, {
            lastModified: this.lastModified,
            type: this.type,
        })
    }

    toWebWorkerFile(): File {
        this.judgeEnvironment();
        if (!isBrowser || !isWebWorker) {
            throw new Error('toWebWorkerFile 方法只能在 Web Worker 环境下使用');
        }
        return this.toBrowserFile.bind(this)();
    }

    toServiceWorkerFile(): File {
        this.judgeEnvironment();
        if (!isServiceWorker) {
            throw new Error('toServiceWorkerFile 方法只能在 Service Worker 环境下使用');
        }
        return this.toBrowserFile.bind(this)();
    }

    toSharedWorkerFile(): File {
        this.judgeEnvironment();
        if (!isSharedWorker) {
            throw new Error('toSharedWorkerFile 方法只能在 Shared Worker 环境下使用');
        }
        return this.toBrowserFile.bind(this)();
    }

    static isSelfFile(obj: unknown): obj is SelfFile {
        return obj instanceof SelfFile;
    }
}
