const path = require("node:path");
const fs = require("node:fs");
const { spawnSync } = require("child_process");

const needDependencies = [
    'typescript',
    '@types/node'
];

const detectCliName = 'tsc';

const localExecMapper = {
    "npm": "npx",
    "pnpm": "pnpm exec",
    "yarn": "yarn dlx"
};

const ignoreDir = [
    'build',
    'scripts',
    'node_modules',
    '.git',
    '.dist',
    '.build'
];

const detectDevDependencies = () => {
    // 核心这里不能使用 process.cwd 来获取，会出问题的呐
    const packageJsonPath = path.resolve(__dirname, "../package.json");
    try {
        const packageJsonContent = fs.readFileSync(packageJsonPath, "utf-8");
        const packageJson = JSON.parse(packageJsonContent);
        const devDependencies = packageJson.devDependencies || {};
        const allIn = needDependencies.every(dependency => {
            return dependency in devDependencies;
        });
        return allIn;
    } catch (error) {
        console.error(`读取 package.json 失败: ${error.message}`);
        return false;
    }
};

const installDependencies = (packageManager) => {
    console.log(`正在使用 ${packageManager} 安装必要的依赖...`);
    const result = spawnSync(packageManager, ['install', '--save-dev', ...needDependencies], {
        stdio: 'inherit'
    });
    
    if (result.status !== 0) {
        throw new Error(`安装依赖失败，请手动运行: ${packageManager} install --save-dev ${needDependencies.join(' ')}`);
    }
};

const getProcessArgvArr = () => {
    const argv = process.argv.slice(2); // 跳过node和脚本名
    
    if (!argv.some(arg => arg === '--file' || arg === '-f')) {
        throw new Error("没有指定运行文件，请使用 --file 或 -f 参数");
    }
    
    return argv;
};

const ensureIndex = (index_1, index_2) => {
    if (index_1 !== -1 && index_2 !== -1) {
        return index_1 > index_2 ? index_1 : index_2;
    }
    else if (index_1 !== -1) {
        return index_1;
    }
    else if (index_2 !== -1) {
        return index_2;
    }
    return -1;
};

const detectPackageManager = () => {
    const argv = getProcessArgvArr();
    let packageManager = 'pnpm';
    let basicIndex = -1;
    
    if (argv.includes('--type') || argv.includes('-t')) {
        basicIndex = ensureIndex(
            argv.indexOf('--type'),
            argv.indexOf('-t')
        );
    }
    
    if (basicIndex !== -1 && basicIndex + 1 < argv.length) {
        const packageManagerStr = argv[basicIndex + 1];
        if (packageManagerStr === 'npm' || packageManagerStr === 'yarn') {
            packageManager = packageManagerStr;
        }
    }
    
    return packageManager;
};

const detectCli = (packageManager) => {
    const localExec = localExecMapper[packageManager];
    try {
        const result = spawnSync(
            localExec.split(' ')[0], 
            [   
                ...localExec.split(' ').slice(1), 
                detectCliName, 
                "--version"
            ]
        );
        return result.status === 0;
    }
    catch (error) {
        return false;
    }
};

const findFileInProject = (fileName, startDir) => {
    try {
        const entries = fs.readdirSync(startDir, { withFileTypes: true });
        
        for (const entry of entries) {
            const fullPath = path.join(startDir, entry.name);

            if (entry.isDirectory() && ignoreDir.includes(entry.name)) {
                continue;
            }

            if (entry.isFile() && entry.name === fileName) {
                return fullPath;
            }

            if (entry.isDirectory()) {
                const found = findFileInProject(fileName, fullPath);
                if (found) {
                    return found;
                }
            }
        }
    } catch (error) {
        console.error(`搜索文件时出错: ${error.message}`);
    }
    
    return null;
};

const detectRunScriptPath = () => {
    const argv = getProcessArgvArr();
    const basicIndex = ensureIndex(
        argv.indexOf('--file'),
        argv.indexOf('-f')
    );
    
    if (basicIndex === -1 || basicIndex + 1 >= argv.length) {
        throw new Error("未提供有效的文件名");
    }
    
    const fileName = argv[basicIndex + 1];
    const projectRoot = path.resolve(__dirname, "../");
    
    let filePath = path.resolve(process.cwd(), fileName);
    if (fs.existsSync(filePath)) {
        return filePath;
    }

    filePath = findFileInProject(fileName, projectRoot);
    if (filePath) {
        return filePath;
    }
    
    throw new Error(`在项目中找不到文件: ${fileName}`);
};

const compileAndRun = (filePath, packageManager) => {
    const localExec = localExecMapper[packageManager];
    const projectRoot = path.resolve(__dirname, '..');
    const tempDir = path.join(projectRoot, '.temp');
    
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }
    
    console.log(`正在编译文件: ${filePath}`);
    const compileResult = spawnSync(
        localExec.split(' ')[0], 
        [
            ...localExec.split(' ').slice(1), 
            'tsc', 
            filePath,
            '--outDir',
            tempDir + '/src'
        ],
        { stdio: 'inherit' }
    );
    const relativeFilePath = path.relative(projectRoot, filePath);
    const compiledFilePath = path.join(
        tempDir,
        relativeFilePath.replace('.ts', '.js')
    );
    if (compileResult.status !== 0) {
        throw new Error("编译失败");
    }
    console.log(`正在运行编译后的文件: ${compiledFilePath}`);
    const runResult = spawnSync(
        // localExec.split(' ')[0],
        'node',
        [compiledFilePath],
        { stdio: 'inherit' }
    );
    if (runResult.status !== 0) {
        throw new Error("运行失败");
    }
    console.log("执行成功!");
};

const main = () => {
    try {
        const packageManager = detectPackageManager();
        if (!detectDevDependencies()) {
            installDependencies(packageManager);
        }
        if (!detectCli(packageManager)) {
            console.error(`${detectCliName} 不可用，正在尝试安装...`);
            installDependencies(packageManager);   
            if (!detectCli(packageManager)) {
                throw new Error(`${detectCliName} 安装失败，请手动安装`);
            }
        }
        const scriptPath = detectRunScriptPath();
        compileAndRun(scriptPath, packageManager);
        
    } catch (error) {
        console.error(`错误: ${error.message}`);
        process.exit(1);
    }
};

main();
