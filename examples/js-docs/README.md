## 使用demo

* 核心实现解析 `markdown` 语法使用的库的是 `marked`

    * github link是：https://github.com/markedjs/marked

* 进行代码的高亮显示使用的库是：`highlight.js`

    * github link是：https://github.com/highlightjs/highlight.js

## 核心思路总结
* 首先先清楚每个包的特定的用处是什么吧
    * `marked` 用于将 markdown 的文本内容进行 AST 的转码将内容实现为 html 内容
    * `highlight.js` 用于对代码块进行高亮显示
* 核心的工具函数的实现思路是什么呢？？
    * 1. init 函数：实现获取得到真真的元素，这个元素是本次需要渲染的文本内容吧，在实际的开发中来源于服务端数据吧
        * 获取容器的 ID Name
        * 调用 marked 库将 md 内容进行 AST 转码
    * 2. parseMdContentToHtml 函数：实现将 md 内容进行解析为 html 内容
        * 调用 marked 库将 md 内容进行 AST 转码
    * 3. renderToDom 函数：实现将 html 内容渲染到指定的容器中
        * 获取容器的 DOM 元素
        * 将 html 内容设置为容器的 innerHTML
    * 4. highlightCodeBlocks 函数：实现对代码块进行高亮显示
        * 调用 highlight.js 库对代码块进行高亮显示
    * 5. 其他的一些辅助函数
        * 实现对代码块进行解析，获取到代码块的语言类型
        * 实现对代码块进行解析，获取到代码块的内容
    
## http-server
* 我们进行实现我们的本地的调试的时候可以进行使用的工具就是：`http-server` 
* 所以说我们就可以在本地开启一个服务的时候就可以使用我们该工具吧

## marked 进行自定义渲染renderer
* 这里的话首先需要是进行实现设计好一套样式即可吧
