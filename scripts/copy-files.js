const fs = require('fs');
const path = require('path');

function copyFile(sourcePath, targetPath) {
    try {
        const targetDir = path.dirname(targetPath);
        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }
      
        fs.copyFileSync(sourcePath, targetPath);
        console.log(`已成功复制 ${sourcePath} 到 ${targetPath}`);
    } catch (error) {
        console.error(`复制文件失败: ${error.message}`);
        process.exit(1);
    }
}

function copyPackageFiles(packageName, targetDir) {
    const rootDir = path.resolve(__dirname, '..');
    const packageDir = path.join(rootDir, 'packages', packageName);
    
    const packageJsonSource = path.join(packageDir, 'package.json');
    const packageJsonTarget = path.join(targetDir, 'package.json');
    copyFile(packageJsonSource, packageJsonTarget);
    
    const readmeSource = path.join(packageDir, 'README.md');
    if (fs.existsSync(readmeSource)) {
        const readmeTarget = path.join(targetDir, 'README.md');
        copyFile(readmeSource, readmeTarget);
    } else {
        console.log(`README.md 文件在 ${packageDir} 不存在，跳过复制`);
    }
}

function main() {
    const args = process.argv.slice(2);
    const packageName = args[0];
    const targetDir = args[1] 
        || path.join(__dirname, '..', 'packages', packageName, 'dist');
    console.log(`开始复制 ${packageName} 包的文件到 ${targetDir}...`);
    copyPackageFiles(packageName, targetDir);
    console.log(`${packageName} 包的文件复制完成！`);
}

main();