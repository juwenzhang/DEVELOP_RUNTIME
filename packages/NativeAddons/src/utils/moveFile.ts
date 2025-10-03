import { accessSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { type GetFileContentType } from "../types/moveFileType";

const getFileContent: (targetFileName: string, isDev?: boolean) => GetFileContentType = 
(targetFileName, isDev = true) => {
    let currentDir: string = './'
    const detectIsHasPackage: () => boolean = () => {
        try {
            let basicFIleName = ""
            switch (isDev) {
                case true:
                    basicFIleName = "package.json";
                    break;
                case false:
                    basicFIleName = targetFileName;
                    break;
            }
            accessSync(resolve(currentDir, basicFIleName));
            return true;
        } catch (err) {
            return false;
        }
    }
    while (!detectIsHasPackage()) {
        currentDir += '../'
    }
    return {
        content: readFileSync(resolve(currentDir, targetFileName), "utf8"),
        targetFilePath: resolve(currentDir, targetFileName),
    }
}

const getAddon: () => void = () => {
    const content = getFileContent("binding.gyp", false).content;
    console.log(content);
}

getAddon();
