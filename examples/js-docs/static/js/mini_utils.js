const MiniDocsUtils = {
    /**
     * 初始化函数
     */
    init(mdContent, containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.log("容器元素不存在，创建新容器，哈哈哈")
            this.createContainer(containerId);
        }
        const processedMd = this.processCustomSyntax(mdContent);
        const htmlContent = this.parseMdContentToHtml(processedMd);
        this.renderToDom(htmlContent);
        this.safeHighlightCodeBlocks();
    },

    /**
     * 配置常量
     */
    CONFIG: {
        supportedTypes: ['note', 'info', 'detail', 'warning', 'error', 'tip'],
        typeMap: {
            note: 'NOTE',
            info: 'INFO', 
            detail: 'DETAIL',
            warning: 'WARNING',
            error: 'ERROR',
            tip: 'TIP'
        },
        icons: {
            NOTE: '📝',
            INFO: 'ℹ️',
            DETAIL: '🔍',
            WARNING: '⚠️',
            ERROR: '❌',
            TIP: '💡'
        },
        defaultTitles: {
            NOTE: '笔记',
            INFO: '信息',
            DETAIL: '详情',
            WARNING: '警告',
            ERROR: '错误',
            TIP: '提示'
        },
        markedOptions: {
            gfm: true,
            breaks: true,
            headerIds: true,
            headerPrefix: 'mini-docs-demo'
        }
    },

    /**
     * 创建容器元素
     */
    createContainer(containerId) {
        const container = document.createElement("div");
        container.id = containerId;
        document.body.appendChild(container);
        this.container = container;
    },

    /**
     * 处理自定义语法
     */
    processCustomSyntax(mdContent) {
        // 使用分步处理的方法
        let processed = mdContent;
        // 处理所有内层块呐
        processed = this.processBlocksByLevel(processed, 'inner');
        // 处理所有外层块呐
        processed = this.processBlocksByLevel(processed, 'outer');
        return processed;
    },

    /**
     * 按层级处理块
     */
    processBlocksByLevel(content, level) {
        const typePattern = this.CONFIG.supportedTypes.join('|');
        let regex;
        
        if (level === 'inner') {
            // 内层块
            regex = new RegExp(`( {4}):::(${typePattern})\\s*(.*?)\\r?\\n([\\s\\S]*?)\\r?\\n( {4}):::`, 'g');
        }
        else {
            // 外层块
            regex = new RegExp(`:::(${typePattern})\\s*(.*?)\\r?\\n([\\s\\S]*?)\\r?\\n:::`, 'g');
        }
        
        return content.replace(regex, (match, ...args) => {
            if (level === 'inner') {
                const [indent1, type, title, content, indent2] = args;
                // 确保是内层块
                if (indent1 && indent2) {
                    const cleanContent = content.replace(/^ {4}/gm, '');
                    return this.renderBlockHTML(type, title, cleanContent, 'inner');
                }
                return match;
            }
            else {
                const [type, title, content] = args;
                // 检查是否被处理过
                if (!match.startsWith('<div class="custom-block')) {
                    return this.renderBlockHTML(type, title, content, 'outer');
                }
                return match;
            }
        });
    },

    /**
     * 渲染块的HTML
     */
    renderBlockHTML(type, title, content, level) {
        const cleanTitle = (title || '').trim();
        const cleanContent = (content || '').trim();
        
        const blockType = this.CONFIG.typeMap[type] || 'NOTE';
        const displayTitle = cleanTitle || this.getDefaultTitle(blockType);
        const icon = this.getCustomIcon(blockType);
        
        // 解析内容中的md
        const parsedContent = marked.parse(cleanContent, this.CONFIG.markedOptions);
        
        return `
<div class="custom-block custom-${blockType.toLowerCase()} custom-${level}">
    <div class="custom-header">
        <span class="custom-icon">${icon}</span>
        <span class="custom-title">${displayTitle}</span>
    </div>
    <div class="custom-content">${parsedContent}</div>
</div>`.trim();
    },

    /**
     * 解析 markdown
     */
    parseMdContentToHtml(mdContent) {
        return marked.parse(mdContent, this.CONFIG.markedOptions);
    },

    /**
     * 工具方法
     */
    getCustomIcon(type) {
        return this.CONFIG.icons[type] || '📄';
    },

    getDefaultTitle(type) {
        return this.CONFIG.defaultTitles[type] || '备注';
    },

    /**
     * 安全的代码高亮
     */
    safeHighlightCodeBlocks() {
        if (typeof hljs === 'undefined') return;
        try {
            const codeBlocks = document.querySelectorAll('pre code');
            codeBlocks.forEach(codeBlock => {
                const language = codeBlock.className.replace(/^language-/, "") || "plaintext";
                codeBlock.className = `language-${language}`;
                hljs.highlightElement(codeBlock);
            });
        }
        catch (error) {
            console.warn('代码高亮失败:', error);
        }
    },

    /**
     * 渲染到 DOM
     */
    renderToDom(htmlContent) {
        this.container.innerHTML = htmlContent;
        this.addHeaderAnchor();
    },

    /**
     * 添加标题锚点
     */
    addHeaderAnchor() {
        const headers = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        headers.forEach(header => {
            if (!header.id) return;
            const anchor = document.createElement("a");
            anchor.href = `#${header.id}`;
            anchor.textContent = "🔗";
            anchor.style.marginLeft = "8px";
            anchor.style.color = "#666";
            header.appendChild(anchor);
        });
    }
};
