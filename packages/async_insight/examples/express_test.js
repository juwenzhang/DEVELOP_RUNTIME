const express = require('express');
const asyncInsight = require('../src/index');

const app = express();
const port = 5000;

app.use((req, res, next) => {
    const { middleware } = asyncInsight.createRequestContext(req, res);
    middleware(next);
})

app.get('/api/user', async (req, res) => {
    const context = asyncInsight.als.getStore();
    console.log("请求正在处理中……", context.requestId, req.method, req.url)
    await new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, 1000);
    });


    res.json({
        requestId: context.requestId,
        method: req.method,
        url: req.url,
    })
})


app.get('/metrics', async (req, res) => {
    try {
        res.set('Content-Type', asyncInsight.metricsRegister.contentType);
        res.end(await asyncInsight.getMetrics());
    } catch (error) {
        res.status(500).send(error.message);
    }
});

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})