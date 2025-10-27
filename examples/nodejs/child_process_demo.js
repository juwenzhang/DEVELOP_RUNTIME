const { spawn } = require('child_process');
const fs = require('fs');

// 将 `ls -l` 输出写入文件
const ls = spawn('ls', ['-l']);
const output = fs.createWriteStream('ls-output.txt');
ls.stdout.pipe(output);