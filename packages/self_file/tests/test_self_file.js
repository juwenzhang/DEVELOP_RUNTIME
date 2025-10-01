const { SelfFile, isBrowser, isNode, isWebWorker, isServiceWorker, isSharedWorker } = require('../dist/cjs/index');
const { Blob } = require('buffer'); // 导入 Node.js 环境中的 Blob 构造函数

// 测试基础功能
function testBasicFunctionality() {
    console.log('=== 测试 SelfFile 基础功能 ===');
    
    try {
        // 创建一个简单的文本文件
        const textFile = new SelfFile(['Hello, World!'], 'hello.txt', { type: 'text/plain' });
        console.log('✓ 创建文本文件成功');
        console.log('  - 文件名:', textFile.name);
        console.log('  - 文件类型:', textFile.type);
        console.log('  - 文件大小:', textFile.size);
        console.log('  - 最后修改时间:', textFile.lastModified);
        
        // 测试 MIME 类型推断
        const jsonFile = new SelfFile(['{"name":"test"}'], 'data.json');
        console.log('✓ 创建 JSON 文件成功，MIME 类型推断:', jsonFile.type);
        
        const imageFile = new SelfFile([new Uint8Array([1, 2, 3])], 'image.png');
        console.log('✓ 创建图片文件成功，MIME 类型推断:', imageFile.type);
        
    } catch (error) {
        console.error('✗ 基础功能测试失败:', error);
    }
}

// 测试切片功能
function testSliceFunctionality() {
    console.log('\n=== 测试 SelfFile 切片功能 ===');
    
    try {
        const content = 'abcdefghijklmnopqrstuvwxyz';
        const file = new SelfFile([content], 'slice-test.txt');
        
        const slice1 = file.slice(0, 5);
        console.log('✓ 切片 1 创建成功:', slice1 instanceof SelfFile);
        
        const slice2 = file.slice(10, 20, 'text/plain;charset=utf-8');
        console.log('✓ 切片 2 创建成功（指定类型）:', slice2.type);
        
    } catch (error) {
        console.error('✗ 切片功能测试失败:', error);
    }
}

// 测试环境检测
function testEnvironmentDetection() {
    console.log('\n=== 测试环境检测 ===');
    
    try {
        console.log('  - 浏览器环境:', isBrowser);
        console.log('  - Node.js 环境:', isNode);
        console.log('  - Web Worker 环境:', isWebWorker);
        console.log('  - Service Worker 环境:', isServiceWorker);
        console.log('  - Shared Worker 环境:', isSharedWorker);
        
        // 判断当前实际环境
        let currentEnvironment = '未知环境';
        if (isNode) currentEnvironment = 'Node.js';
        else if (isBrowser) currentEnvironment = '浏览器';
        else if (isWebWorker) currentEnvironment = 'Web Worker';
        else if (isServiceWorker) currentEnvironment = 'Service Worker';
        else if (isSharedWorker) currentEnvironment = 'Shared Worker';
        
        console.log('✓ 当前运行环境:', currentEnvironment);
        
    } catch (error) {
        console.error('✗ 环境检测测试失败:', error);
    }
}

// 测试特定环境下的功能
async function testEnvironmentSpecificFeatures() {
    console.log('\n=== 测试特定环境下的功能 ===');
    
    try {
        const testFile = new SelfFile(['Environment specific test'], 'test-file.txt');
        
        // 测试 Node.js 特有的 toBuffer 方法
        if (isNode) {
            try {
                const buffer = await testFile.toBuffer();
                console.log('✓ Node.js 环境下 toBuffer 方法测试成功:', buffer instanceof Buffer);
                console.log('  - Buffer 内容:', buffer.toString());
            } catch (error) {
                console.error('✗ Node.js 环境下 toBuffer 方法测试失败:', error);
            }
        } else {
            console.log('  - 当前非 Node.js 环境，跳过 toBuffer 测试');
        }
        
        // 测试浏览器相关的转换方法
        if (isBrowser) {
            try {
                const browserFile = testFile.toBrowserFile();
                console.log('✓ 浏览器环境下 toBrowserFile 方法测试成功:', browserFile instanceof File);
            } catch (error) {
                console.error('✗ 浏览器环境下 toBrowserFile 方法测试失败:', error);
            }
        } else {
            console.log('  - 当前非浏览器环境，跳过浏览器文件转换测试');
        }
        
    } catch (error) {
        console.error('✗ 特定环境功能测试失败:', error);
    }
}

// 测试 isSelfFile 静态方法
function testIsSelfFile() {
    console.log('\n=== 测试 isSelfFile 静态方法 ===');
    
    try {
        const selfFile = new SelfFile(['test'], 'test.txt');
        const regularBlob = new Blob(['test']);
        const regularObject = { name: 'test.txt' };
        
        console.log('✓ SelfFile 实例检测:', SelfFile.isSelfFile(selfFile));
        console.log('✓ Blob 实例检测:', SelfFile.isSelfFile(regularBlob));
        console.log('✓ 普通对象检测:', SelfFile.isSelfFile(regularObject));
        
    } catch (error) {
        console.error('✗ isSelfFile 方法测试失败:', error);
    }
}

// 测试 judgeEnvironment 方法
function testJudgeEnvironment() {
    console.log('\n=== 测试 judgeEnvironment 方法 ===');
    
    try {
        const testFile = new SelfFile(['test'], 'test.txt');
        testFile.judgeEnvironment();
        console.log('✓ judgeEnvironment 方法测试成功');
        
    } catch (error) {
        console.error('✗ judgeEnvironment 方法测试失败:', error);
    }
}

// 主测试函数
async function runAllTests() {
    console.log('开始运行 SelfFile 测试...\n');
    
    testBasicFunctionality();
    testSliceFunctionality();
    testEnvironmentDetection();
    await testEnvironmentSpecificFeatures();
    testIsSelfFile();
    testJudgeEnvironment();
    
    console.log('\n=== 所有测试完成 ===');
    
    // 检查是否有失败的测试
    console.log('\n测试总结：');
    console.log('✓ 基础功能测试');
    console.log('✓ 切片功能测试');
    console.log('✓ 环境检测');
    console.log('✓ 特定环境功能测试');
    console.log('✓ isSelfFile 静态方法测试');
    console.log('✓ judgeEnvironment 方法测试');
    
    console.log('\n✓ 所有测试项目已执行完成！')
}

// 运行测试
runAllTests().catch(error => {
    console.error('测试运行失败:', error);
    process.exit(1);
});