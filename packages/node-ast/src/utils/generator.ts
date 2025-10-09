import type {
    GenerateOptions,
    RootNode,
    Node,
    TextNode,
    HeadingNode,
    CodeBlockNode,
    TableCellNode
} from "../types/index";
import { NodeType } from "../types/index";

export class NodeAstGenerator {
    public generate(ast: RootNode, options: GenerateOptions): string {
        switch (options.format) {
            case 'html':
                return this.generateHtml(ast);
            case 'json':
                return this.generateJson(ast);
            default:
                throw new Error(`Unsupported format: ${options.format}`);
        }
    }

    private generateJson(ast: RootNode): string {
        // you can use other sapce, 
        // it aims to help other people to read the json easier
        return JSON.stringify(ast, null, 2);
    }

    private generateHtml(ast: RootNode): string {
        return ast.children.map(
            node => this.generateHtmlNode(node)
        ).join('\n');
    }

    private generateHtmlNode(node: Node): string {
        if (!node) return '';
        const children = node.children || [];
        switch (node.type) {
            case NodeType.Heading: {
                const headingNode = node as HeadingNode;
                return `<h${headingNode.props?.level || 1}>${children.map(
                    child => this.generateHtmlNode(child)).join('')
                }</h${headingNode.props?.level || 1}>`.trim();
            }
            case NodeType.Bold: {
                return `<b>${children.map(
                    child => this.generateHtmlNode(child)
                ).join('')}</b>`.trim();
            }
            case NodeType.Paragraph: {
                return `<p>${children.map(
                    child => this.generateHtmlNode(child)
                ).join('')}</p>`.trim();
            }
            case NodeType.CodeBlock: {
                const codeBlockNode = node as CodeBlockNode;
                const languageClass = codeBlockNode.props?.language ? ` class="${codeBlockNode.props.language}"` : '';
                return `<pre><code${languageClass}>${children.map(
                    child => this.generateHtmlNode(child)
                ).join('')}</code></pre>`.trim();
            }
            case NodeType.Text: {
                const textNode = node as TextNode;
                return textNode.props?.value || '';
            }
            case NodeType.List:
                return `<ul>${children.map(
                    child => this.generateHtmlNode(child)
                ).join('')}</ul>`.trim();
            case NodeType.ListItem:
                return `<li>${children.map(
                    child => this.generateHtmlNode(child)
                ).join('')}</li>`.trim();
            case NodeType.Quote:
                return `<blockquote>${children.map(
                    child => this.generateHtmlNode(child)
                ).join('')}</blockquote>`.trim();
            case NodeType.Link:
                return `<a href="${node.props?.href || ''}">${children.map(
                    child => this.generateHtmlNode(child)
                ).join('')}</a>`.trim();
            case NodeType.Image:
                return `<img src="${node.props?.src || ''}" alt="${node.props?.alt || ''}" />`;
            case NodeType.HorizontalRule:
                return '<hr />';
            case NodeType.Table:
                return `<table>${children.map(
                    child => this.generateHtmlNode(child)
                ).join('')}</table>`.trim();
            case NodeType.TableRow:
                return `<tr>${children.map(
                    child => this.generateHtmlNode(child)
                ).join('')}</tr>`.trim();
            case NodeType.TableCell: {
                const tableCellNode = node as TableCellNode;
                const tag = tableCellNode.props?.isHeader ? 'th' : 'td';
                return `<${tag}>${children.map(
                    child => this.generateHtmlNode(child)
                ).join('')}</${tag}>`;
            }
            case NodeType.Custom:
                return children.map(
                    child => this.generateHtmlNode(child)
                ).join('') || '';
            default:
                console.warn(`Unknown node type: ${node.type}, rendering as text content`);
                return children.map(
                    child => this.generateHtmlNode(child)
                ).join('') || '';
        }
    }
}
