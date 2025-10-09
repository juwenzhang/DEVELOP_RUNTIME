import { accessSync, readFileSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { type GetFileContentType } from "../types/moveFileType";

// @ts-ignore
const __filename = (typeof __filename !== 'undefined') ? __filename : fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const TEMPORARY_FILENAME = "temporary_file.json";

const getFileContent: (targetFileName: string, isDev?: boolean) => GetFileContentType 
= (targetFileName, isDev = true) => {
    let currentDir: string = './';
    
    const hasPackageFile: () => boolean = () => {
        try {
            let basicFileName = "";
            switch (isDev) {
                case true:
                    basicFileName = "package.json";
                    break;
                case false:
                    basicFileName = targetFileName;
                    break;
            }
            accessSync(resolve(currentDir, basicFileName));
            return true;
        } catch (err) {
            return false;
        }
    }
    
    while (!hasPackageFile()) {
        currentDir += '../';
    }
    
    return {
        content: readFileSync(resolve(currentDir, targetFileName), "utf8"),
        targetFilePath: resolve(currentDir, targetFileName),
    };
};

const writeContentIntoTemporaryFile: (content: string) => string 
= (content: string) => {
    try {
        const TEMPORARY_FILENAME_PATH = join(__dirname, TEMPORARY_FILENAME);
        if (existsSync(TEMPORARY_FILENAME_PATH)) {
            rmSync(TEMPORARY_FILENAME_PATH);
        }
        writeFileSync(TEMPORARY_FILENAME_PATH, content, { encoding: 'utf8' });
        return TEMPORARY_FILENAME_PATH;
    } catch (error) {
        console.error('写入临时文件失败:', error);
        throw error;
    }
};

const getAddon: () => void 
= () => {
    try {
        const content = getFileContent("binding.gyp", false).content;
        const TEMPORARY_FILENAME_PATH = writeContentIntoTemporaryFile(content);
        const _content = readFileSync(TEMPORARY_FILENAME_PATH, 'utf8');
        console.log('临时文件内容:', _content);
    } catch (error) {
        console.error('获取addon失败:', error);
    }
};

getAddon();
