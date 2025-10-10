import {
    NodeAstMdParser,
    NodeAstMdParserInstance,
    NodeAstGenerator,
    NodeAstTransformer
} from "./utils/index";
import type {
    ParseOptions,
    GenerateOptions,
    Plugin,
    RootNode,
    Node,
    TextNode,
} from "./types/index"
import { NodeType } from "./types/index";
import {
    AllPlugin,
    BoldPlugin,
    CodeBlockLangPlugin,
    CodeBlockPlugin,
    CustomPlugin,
    HeadingPlugin,
    HorizontalRulePlugin,
    ImagePlugin,
    LinkPlugin,
    ListPlugin,
    ListItemPlugin,
    ParagraphPlugin,
    QuotePlugin,
    TableCellPlugin,
    TablePlugin,
    TableRowPlugin,
    TextPlugin
} from "./plugins/index";
import fs from "fs";
import path from "path";

const DEFAULT_PLUGINS = [
    AllPlugin,
    BoldPlugin,
    CodeBlockLangPlugin,
    CodeBlockPlugin,
    CustomPlugin,
    HeadingPlugin,
    HorizontalRulePlugin,
    ImagePlugin,
    LinkPlugin,
    ListPlugin,
    ListItemPlugin,
    ParagraphPlugin,
    QuotePlugin,
    TableCellPlugin,
    TablePlugin,
    TableRowPlugin,
    TextPlugin
];

let nativeAddonsHeadingExtract: any = null;
if (typeof window === "undefined") {
    try {
        nativeAddonsHeadingExtract = require("../build/Release/heading_extract.node");
    } catch (error) {
        console.error("Failed to load heading_extract.node:", error);
    }
}

class NodeAstLib {
    private parser: NodeAstMdParser;
    private transformer: NodeAstTransformer;
    private generator: NodeAstGenerator;

    constructor() {
        this.parser = NodeAstMdParserInstance;
        this.transformer = new NodeAstTransformer();
        this.generator = new NodeAstGenerator();
        // register all default plugins
        DEFAULT_PLUGINS.forEach(plugin => this.transformer.use(plugin));
    }

    // register self-define plugin
    use(plugin: Plugin): void {
        this.transformer.use(plugin);
    }

    // parse markdown content to ast
    parserMarkdownContent(markdown: string): RootNode {
        return this.parser.parse(markdown);
    }

    // parser markdown file
    parserMarkdownFile(filePath: string): RootNode {
        if (typeof window !== "undefined") {
            throw new Error("parserMarkdownFile is not supported in browser environment");
        }
        const absolutePath = path.resolve(filePath);
        if (!fs.existsSync(absolutePath)) {
            throw new Error(`File not found: ${absolutePath}`);
        }
        const markdownContent = fs.readFileSync(absolutePath, "utf-8");
        return this.parser.parse(markdownContent);
    }

    // transform ast
    transformAst(ast: RootNode): RootNode {
        return this.transformer.transform(ast);
    }

    // generate hope format content
    generateContent(ast: RootNode, options: GenerateOptions): string {
        return this.generator.generate(ast, options);
    }

    // process markdown content
    processMarkdownContent(markdown: string, options: GenerateOptions & ParseOptions): string {
        const ast = this.parserMarkdownContent(markdown);
        const transformedAst = this.transformAst(ast);
        return this.generateContent(transformedAst, options);
    }

    // process markdown file
    processMarkdownFile(filePath: string, options: GenerateOptions & ParseOptions): string {
        const ast = this.parserMarkdownFile(filePath);
        const transformedAst = this.transformAst(ast);
        return this.generateContent(transformedAst, options);
    }

    extractHeadings(mdContent: string): Array<{
        level: number,
        title: string,
        id: string
    }> {
        if (nativeAddonsHeadingExtract) {
            return nativeAddonsHeadingExtract.extractHeadings(mdContent);
        }
        const ast = this.parserMarkdownContent(mdContent);
        const headings: Array<{
            level: number,
            title: string,
            id: string
        }> = [];
        const traverse = (nodes: Node[]) => {
            nodes.forEach(node => {
                if (node.type === NodeType.Heading) {
                    const textNode = node.children[0] as TextNode;
                    headings.push({
                        level: node.props.level,
                        title: textNode.props.value,
                        id: textNode.props.id
                    });
                }
                if (node.children) {
                    traverse(node.children);
                }
            })
        };
        traverse(ast.children);
        return headings;
    }
}

export default NodeAstLib;
export {
    NodeAstLib
}
