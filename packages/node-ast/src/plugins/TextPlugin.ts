import {
    RootNode,
    Node,
    Plugin,
    TextNode,
    ListNode,
    ListItemNode,
    TableNode,
    TableRowNode,
    TableCellNode
} from "../types/index";
import { NodeType } from "../types/index";

const TextPlugin: Plugin = {
    name: "TextPlugin",
    transform: (ast: RootNode): RootNode => {
        const traverse = (nodes: Node[]): Node[] => {
            return nodes.map(node => {
                const children = node.children || [];
                const processedChildren = traverse(children);
                
                switch (node.type) {
                    case NodeType.Text:
                        return {
                            ...node,
                            props: {
                                ...node.props,
                                value: node.props?.value || ""
                            },
                            children: processedChildren
                        } as TextNode;
                    case NodeType.List:
                        return {
                            type: NodeType.List,
                            props: node.props || {},
                            children: processedChildren
                        } as any as ListNode;
                    case NodeType.ListItem:
                        return {
                            type: NodeType.ListItem,
                            props: node.props || {},
                            children: processedChildren
                        } as any as ListItemNode;
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
                    case NodeType.TableCell:
                        return {
                            type: NodeType.TableCell,
                            props: node.props || {},
                            children: processedChildren
                        } as any as TableCellNode;
                    case NodeType.Root:
                        return {
                            type: NodeType.Root,
                            props: node.props || {},
                            children: processedChildren
                        };
                    // 处理其他常见节点类型
                    case NodeType.Heading:
                    case NodeType.Paragraph:
                    case NodeType.Quote:
                    case NodeType.Bold:
                    case NodeType.Link:
                    case NodeType.Image:
                    case NodeType.HorizontalRule:
                    case NodeType.CodeBlock:
                    case NodeType.Custom:
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
        
        return {
            ...ast,
            children: traverse(ast.children)
        };
    }
};

export default TextPlugin;