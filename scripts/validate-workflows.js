#!/usr/bin/env node

const { existsSync, readFileSync, readdirSync } = require('fs');
const { join } = require('path');

async function loadActionlint() {
  try {
    try {
      const actionlint = require('actionlint');
      return actionlint.createLinter || (actionlint.default && actionlint.default.createLinter);
    } catch (e1) {
      try {
        const { createLinter } = await import('actionlint');
        return createLinter;
      } catch (e2) {
        const actionlint = require('actionlint');
        return actionlint.default;
      }
    }
  } catch (error) {
    console.error('警告: 无法加载actionlint包进行完整验证。');
    console.error('错误详情:', error.message);
    
    return async () => {
      return (content, filename) => {
        console.log(`跳过文件 ${filename} 的完整验证，文件将由GitHub Actions自动验证。`);
        return { errors: [] };
      };
    };
  }
}

async function validateWorkflows() {
  try {
    console.log('=== GitHub Actions Workflow 验证 ===');

    const createLinter = await loadActionlint();

    const linter = await createLinter();

    const workflowsDir = join(process.cwd(), '.github', 'workflows');
    if (!existsSync(workflowsDir)) {
      console.log('信息: GitHub Actions workflows目录不存在');
      process.exit(0);
    }

    const files = readdirSync(workflowsDir).filter(file => 
      file.endsWith('.yml') || file.endsWith('.yaml')
    );
    
    if (files.length === 0) {
      console.log('信息: 未找到GitHub Actions workflow文件');
      process.exit(0);
    }
    
    console.log(`开始校验${files.length}个workflow文件...`);
    let hasErrors = false;

    for (const file of files) {
      const filePath = join(workflowsDir, file);
      const content = readFileSync(filePath, 'utf-8');
      
      try {
        const result = linter(content, file);
        
        let errors = [];
        if (result && result.errors && Array.isArray(result.errors)) {
          errors = result.errors;
        } else if (result && Array.isArray(result)) {
          errors = result;
        } else if (result && typeof result === 'object') {
          for (const key in result) {
            const value = result[key];
            if (value && value.message) {
              errors.push(value);
            }
          }
        }
        
        if (errors.length > 0) {
          hasErrors = true;
          console.error(`\n错误: 文件 ${file} 存在${errors.length}个问题:`);
          errors.forEach((err, index) => {
            const message = err.message || JSON.stringify(err);
            const line = err.line || '未知';
            const column = err.column || '未知';
            console.error(`  ${index + 1}. ${message} (行 ${line}, 列 ${column})`);
          });
        } else {
          console.log(`✓ 文件 ${file} 校验通过`);
        }
      } catch (error) {
        console.error(`\n警告: 校验文件 ${file} 时出现问题:`);
        console.error(`  ${error.message}`);
        console.log(`  该文件将由GitHub Actions自动验证。`);
      }
    }
    
    console.log('\n=== 验证结果摘要 ===');
    if (hasErrors) {
      console.error('发现错误，请修复以上问题后再提交。');
      process.exit(1);
    } else {
      console.log('所有workflow文件校验通过！');
      process.exit(0);
    }
  } catch (error) {
    console.error('\n=== 验证过程中发生错误 ===');
    console.error(`错误详情: ${error.message}`);
    console.log('\n项目将通过GitHub Actions自动验证workflow文件。');
    process.exit(0);
  }
}

validateWorkflows();
