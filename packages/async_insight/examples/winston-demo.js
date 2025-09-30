const winston = require('winston');

// https://juejin.cn/post/6865926810061045774?searchId=20250929233614C31DB7B8A1917F08F395
const logger = winston.createLogger({
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({filename: 'combined.log'})
    ]
})
logger.info('console and file')

