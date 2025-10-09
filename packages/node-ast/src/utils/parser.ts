import type {
    RootNode,
    TextNode,
    HeadingNode,
    ParagraphNode,
    BoldNode,
    CodeBlockNode,
    ListNode,
    ListItemNode,
    QuoteNode,
    TableNode,
    TableRowNode,
    TableCellNode,
    ParseOptions,
    Node
} from "../types/index";
import { NodeType } from "../types/index";
import RegExpMapper from "../constants/index";

class NodeAstMdParser {
    private options: Required<ParseOptions>;
    private static NodeAstMdParserInstance: NodeAstMdParser;

    private constructor(options: ParseOptions) {
        this.options = {
            gfm: options.gfm ?? true,
            ...options,
        }
    }

    public static getInstance(options: ParseOptions): NodeAstMdParser {
        if (!NodeAstMdParser.NodeAstMdParserInstance) {
            NodeAstMdParser.NodeAstMdParserInstance = new NodeAstMdParser(options);
        }
        return NodeAstMdParser.NodeAstMdParserInstance;
    }

    public parse(mdContent: string): RootNode {
        const rootNode: RootNode = {
            type: NodeType.Root,
            children: [],
        };
        
        if (!mdContent || typeof mdContent !== 'string') {
            return rootNode;
        }
        
        const lines = mdContent.split("\n");
        let i = 0;
        
        while (i < lines.length) {
            const line = lines[i]?.trim() || '';
            if (line === '') {
                i++;
                continue;
            }
            
            if (this.ParserIsHeading(line)) {
                rootNode.children.push(this.parserHeading(line));
            } 
            else if (line.startsWith('```')) {
                const { node, newIndex } = this.parserMultiLineCodeBlock(lines, i);
                rootNode.children.push(node);
                i = newIndex;
                continue;
            }
            else if (this.ParserIsHorizontalRule(line)) {
                rootNode.children.push(this.parserHorizontalRule());
            }
            else if (this.ParserIsQuote(line)) {
                const { node, newIndex } = this.parserMultiLineQuote(lines, i);
                rootNode.children.push(node);
                i = newIndex;
                continue;
            }
            else if (this.ParserIsListOrderedItem(line) || this.ParserIsListUnorderedItem(line)) {
                const { node, newIndex } = this.parserList(lines, i);
                rootNode.children.push(node);
                i = newIndex;
                continue;
            }
            else if (this.ParserIsTable(line)) {
                const { node, newIndex } = this.parserTable(lines, i);
                rootNode.children.push(node);
                i = newIndex;
                continue;
            }
            else if (this.ParserIsBold(line)) {
                rootNode.children.push(this.parserBold(line));
            }
            else if (this.ParserIsParagraph(line)) {
                rootNode.children.push(this.parserEnhancedParagraph(line));
            }
            else {
                rootNode.children.push(this.parserTextCode(line));
            }
            
            i++;
        }
        
        return rootNode;
    }

    private ParserIsHeading(line: string): boolean {
        return RegExpMapper.HEADING.test(line);
    }
    
    private parserHeading(line: string): HeadingNode {
        const match = line.match(RegExpMapper.HEADING);
        if (!match) {
            return this.createDefaultHeadingNode(line);
        }
        
        const level = Math.min(match[0].trim().length, 6) as 1 | 2 | 3 | 4 | 5 | 6;
        const content = line.substring(match[0].length).trim();
        
        return {
            type: NodeType.Heading,
            props: {
                level,
            },
            children: [
                {
                    type: NodeType.Text,
                    props: {
                        value: content,
                    },
                    children: [],
                },
            ],
        };
    }
    
    private ParserIsBold(line: string): boolean {
        return RegExpMapper.BOLD.test(line);
    }
    
    private parserBold(line: string): BoldNode {
        const match = line.match(RegExpMapper.BOLD);
        
        if (!match || !match[1]) {
            return this.createDefaultBoldNode(line);
        }
        
        const content = match[1].trim();
        
        return {
            type: NodeType.Bold,
            children: [
                {
                    type: NodeType.Text,
                    props: {
                        value: content,
                    },
                    children: [],
                },
            ],
        };
    }
    
    private ParserIsParagraph(line: string): boolean {
        return RegExpMapper.PARAGRAPH.test(line);
    }
    
    private parserParagraph(line: string): ParagraphNode {
        return {
            type: NodeType.Paragraph,
            children: [
                {
                    type: NodeType.Text,
                    props: {
                        value: line.trim(),
                    },
                    children: [],
                },
            ],
        };
    }
    
    private parserEnhancedParagraph(line: string): ParagraphNode {
        const children: Node[] = [];
        let remainingText = line;
        
        const linkMatch = remainingText.match(RegExpMapper.LINK);
        if (linkMatch) {
            if (linkMatch.index && linkMatch.index > 0) {
                children.push(this.createTextNode(remainingText.substring(0, linkMatch.index)));
            }
            children.push({
                type: NodeType.Link,
                props: {
                    href: linkMatch[2] || ''
                },
                children: [
                    this.createTextNode(linkMatch[1] || '')
                ]
            });
            
            remainingText = remainingText.substring((linkMatch.index || 0) + linkMatch[0].length);
        }

        const imageMatch = remainingText.match(RegExpMapper.IMAGE);
        if (imageMatch) {
            if (imageMatch.index && imageMatch.index > 0) {
                children.push(this.createTextNode(remainingText.substring(0, imageMatch.index)));
            }            
            children.push({
                type: NodeType.Image,
                props: {
                    src: imageMatch[2] || '',
                    alt: imageMatch[1] || ''
                },
                children: []
            });
            remainingText = remainingText.substring((imageMatch.index || 0) + imageMatch[0].length);
        }

        if (remainingText.trim()) {
            children.push(this.createTextNode(remainingText));
        }

        if (children.length === 0) {
            return this.parserParagraph(line);
        }
        
        return {
            type: NodeType.Paragraph,
            children
        };
    }
    
    private parserMultiLineCodeBlock(lines: string[], startIndex: number): { node: CodeBlockNode, newIndex: number } {
        let i = startIndex;
        const startLine = lines[i]?.trim() || '';

        const langMatch = startLine.match(RegExpMapper.CODE_BLOCK_LANG);
        let language: string | undefined;
        
        if (langMatch && langMatch[1]) {
            language = langMatch[1];
        } else if (startLine.startsWith('```')) {
            const langPart = startLine.substring(3).trim();
            if (langPart) {
                language = langPart;
            }
        }
        
        let content = '';
        i++;
        
        while (i < lines.length && lines[i] && !lines[i]!.trim().endsWith('```')) {
            content += lines[i] + '\n';
            i++;
        }
        
        if (i < lines.length) {
            i++;
        }
        return {
            node: {
                type: NodeType.CodeBlock,
                props: language ? { language } : {},
                children: [
                    this.createTextNode(content.trim())
                ]
            },
            newIndex: i
        };
    }
    
    private ParserIsHorizontalRule(line: string): boolean {
        return RegExpMapper.HORIZONTAL_RULE.test(line);
    }
    
    private parserHorizontalRule(): Node {
        return {
            type: NodeType.HorizontalRule,
            props: {},
            children: []
        };
    }
    
    private ParserIsQuote(line: string): boolean {
        return RegExpMapper.QUOTE.test(line);
    }
    
    private parserMultiLineQuote(lines: string[], startIndex: number): { node: QuoteNode, newIndex: number } {
        let i = startIndex;
        let content = '';
        
        while (i < lines.length && lines[i] && RegExpMapper.QUOTE.test(lines[i]!.trim())) {
            if (lines[i]) {
                  const lineContent = lines[i]!.replace(RegExpMapper.QUOTE, '').trim();
                  content += (content ? '\n' : '') + lineContent;
              }
            i++;
        }
        
        return {
            node: {
                type: NodeType.Quote,
                children: [
                    this.createTextNode(content)
                ]
            },
            newIndex: i
        };
    }
    
    private ParserIsListUnorderedItem(line: string): boolean {
        return RegExpMapper.LIST_UNORDERED_ITEM.test(line);
    }
    
    private ParserIsListOrderedItem(line: string): boolean {
        return RegExpMapper.LIST_ORDERED_ITEM.test(line);
    }
    
    private parserList(lines: string[], startIndex: number): { node: ListNode, newIndex: number } {
        let i = startIndex;
        const isOrdered = lines[i] ? this.ParserIsListOrderedItem(lines[i]!.trim()) : false;
        const listItems: ListItemNode[] = [];
        
        while (i < lines.length) {
            const line = lines[i] ? lines[i]!.trim() : '';
            
            const isListItem = isOrdered ? 
                this.ParserIsListOrderedItem(line) : 
                this.ParserIsListUnorderedItem(line);
            
            if (!isListItem && line !== '') {
                break;
            }
            
            if (line !== '') {
                const content = line.replace(isOrdered ? 
                    RegExpMapper.LIST_ORDERED_ITEM : 
                    RegExpMapper.LIST_UNORDERED_ITEM, '').trim();
                
                listItems.push({
                    type: NodeType.ListItem,
                    children: [
                        this.createTextNode(content)
                    ]
                });
            }
            
            i++;
        }
        
        return {
            node: {
                type: NodeType.List,
                props: {
                    ordered: isOrdered || false
                },
                children: listItems
            },
            newIndex: i
        };
    }
    
    private ParserIsTable(line: string): boolean {
        return RegExpMapper.TABLE_ROW.test(line);
    }
    
    private parserTable(lines: string[], startIndex: number): { node: TableNode, newIndex: number } {
        let i = startIndex;
        const rows: TableRowNode[] = [];
        let hasHeader = false;
        
        if (i + 1 < lines.length && lines[i + 1] && RegExpMapper.TABLE_SEPARATOR.test(lines[i + 1]!.trim())) {
            hasHeader = true;
        }

        if (hasHeader) {
            const headerRow = this.parseTableRow(lines[i]?.trim() || '', true);
            if (headerRow.cells.length > 0) {
                rows.push(headerRow.row);
            }
            i += 2;
        } else {
            i++;
        }

        while (i < lines.length && lines[i] && RegExpMapper.TABLE_ROW.test(lines[i]!.trim())) {
            const dataRow = this.parseTableRow(lines[i]?.trim() || '', false);
            if (dataRow.cells.length > 0) {
                rows.push(dataRow.row);
            }
            i++;
        }
        
        return {
            node: {
                type: NodeType.Table,
                props: {
                    hasHeader
                },
                children: rows
            },
            newIndex: i
        };
    }
    
    private parseTableRow(line: string, isHeader: boolean): { row: TableRowNode, cells: TableCellNode[] } {
        const cellContents = line.substring(1, line.length - 1).split('|').map(cell => cell.trim());
        const cells: TableCellNode[] = cellContents.map(content => ({
            type: NodeType.TableCell,
            props: {
                isHeader
            },
            children: [
                this.createTextNode(content)
            ]
        }));
        
        return {
            row: {
                type: NodeType.TableRow,
                children: cells
            },
            cells
        };
    }
    
    private parserTextCode(line: string): TextNode {
        return this.createTextNode(line.trim());
    }
    
    private createTextNode(value: string): TextNode {
        return {
            type: NodeType.Text,
            props: {
                value: value || '',
            },
            children: [],
        };
    }

    private createDefaultHeadingNode(content: string): HeadingNode {
        return {
            type: NodeType.Heading,
            props: {
                level: 1,
            },
            children: [
                this.createTextNode(content)
            ],
        };
    }
    
    private createDefaultBoldNode(content: string): BoldNode {
        return {
            type: NodeType.Bold,
            children: [
                this.createTextNode(content)
            ],
        };
    }

    public setOptions(options: ParseOptions) {
        this.options = {
            ...this.options,
            ...options,
        };
    }

    public getOptions(): ParseOptions {
        return this.options;
    }
}

export default NodeAstMdParser;
const NodeAstMdParserInstance = NodeAstMdParser.getInstance({gfm: true});
export {
    NodeAstMdParser,
    NodeAstMdParserInstance
};
