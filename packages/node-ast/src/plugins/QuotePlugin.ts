import {
    RootNode,
    Node,
    Plugin,
    TextNode,
    QuoteNode,
    ListNode,
    TableNode,
    TableRowNode
} from "../types/index";
import { NodeType } from "../types/index";
import RegExpMapper from "../constants/index";

const QuotePlugin: Plugin = {
    name: "QuotePlugin",
    transform: (ast: RootNode): RootNode => {
        const traverse = (nodes: Node[]): Node[] => {
            return nodes.map(node => {
                const children = node.children || [];
                const processedChildren = traverse(children);
                
                switch (node.type) {
                    case NodeType.Quote:
                        return {
                            ...node,
                            children: transformQuoteChildren(processedChildren)
                        } as QuoteNode;
                    case NodeType.List:
                        return {
                            type: NodeType.List,
                            props: node.props || {},
                            children: processedChildren
                        } as any as ListNode;
                    case NodeType.Table:
                        return {
                            type: NodeType.Table,
                            props: node.props || {},
                            children: processedChildren
                        } as any as TableNode;
                    case NodeType.TableRow:
                        return {
                            type: NodeType.TableRow,
                            props: node.props || {},
                            children: processedChildren
                        } as any as TableRowNode;
                    case NodeType.Root:
                        return {
                            type: NodeType.Root,
                            props: node.props || {},
                            children: processedChildren
                        };
                    case NodeType.Heading:
                    case NodeType.Paragraph:
                    case NodeType.Bold:
                    case NodeType.Text:
                    case NodeType.Link:
                    case NodeType.Image:
                    case NodeType.HorizontalRule:
                    case NodeType.CodeBlock:
                    case NodeType.Custom:
                    case NodeType.ListItem:
                    case NodeType.TableCell:
                        return {
                            ...node,
                            children: processedChildren
                        };
                    default:
                        return {
                            type: (node as any).type,
                            props: (node as any).props,
                            children: processedChildren
                        } as Node;
                }
            });
        };
        
        const transformQuoteChildren = (children: Node[]): Node[] => {
            return children.map(child => {
                if (isTextNode(child)) {
                    const value = child.props.value.replace(RegExpMapper.QUOTE, "");
                    return createTextNode(value);
                }
                return child;
            });
        };

        const isTextNode = (node: Node): node is TextNode => {
            return node.type === NodeType.Text && 
                   node.props !== undefined && 
                   typeof (node.props as any).value === 'string';
        };

        const createTextNode = (value: string): TextNode => {
            return {
                type: NodeType.Text,
                props: { value },
                children: []
            };
        };
        
        return {
            ...ast,
            children: traverse(ast.children)
        };
    }
};

export default QuotePlugin;