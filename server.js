const express = require('express');
const fs = require('fs');
const path = require('path');

// ST 会把 express 路由传递进来
function initServer(router) {
    // 创建一个API接口供我们的前端 index.js 调用
    router.get('/get-memory', (req, res) => {
        // 获取当前聊天的ID (这需要在前端发请求时带上，暂作演示)
        const chatId = req.query.chatId || 'default_chat';
        
        // 拼接记忆文件的路径
        const memoryPath = path.join(__dirname, `../../../../chats/${chatId}_memory.json`);

        // 如果文件存在，读取并返回；不存在则返回默认骨架
        if (fs.existsSync(memoryPath)) {
            const data = JSON.parse(fs.readFileSync(memoryPath, 'utf8'));
            res.json(data);
        } else {
            res.json({
                "metadata": { "version": "1.0" },
                "characterState": { "internalMonologue": "我初来乍到，对世界一无所知。" }
            });
        }
    });

    // 这里未来用来写 /summarize 接口，调用外部LLM API
    router.post('/summarize', express.json(), async (req, res) => {
        // TODO: 计划书的 Milestone 1 核心：实现向 Groq/OpenAI 发送请求并保存结果
        res.json({ status: "success", message: "总结功能搭建中..." });
    });
}

// 导出初始化函数供 ST 调用
module.exports = { initServer };
