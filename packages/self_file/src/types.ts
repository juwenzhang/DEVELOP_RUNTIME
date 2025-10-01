export interface UniversalFileOption {
    lastModified?: number;
    type?: string;
    endings?: 'transparent' | 'native';
}

export interface FileLike {
    name?: string;
    lastModified?: number;
    type?: string;
    size?: number;
    slice(start?: number, end?: number, content_type?: string): Blob | UniversalFileOption;
    arrayBuffer(): Promise<ArrayBuffer>;
    text(): Promise<string>;
}