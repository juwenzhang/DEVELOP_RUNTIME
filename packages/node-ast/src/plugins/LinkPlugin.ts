import {
    RootNode,
    Node,
    Plugin,
    LinkNode,
    ListNode,
    TableNode,
    TableRowNode
} from "../types/index";
import { NodeType } from "../types/index";

const LinkPlugin: Plugin = {
    name: "LinkPlugin",
    transform: (ast: RootNode): RootNode => {
        const traverse = (nodes: Node[]): Node[] => {
            return nodes.map(node => {
                const children = node.children || [];
                const processedChildren = traverse(children);
                
                switch (node.type) {
                    case NodeType.Link:
                        return {
                            ...node,
                            props: {
                                ...node.props,
                                href: node.props?.href || "#"
                            },
                            children: processedChildren
                        } as LinkNode;
                    case NodeType.List:
                        return {
                            type: NodeType.List,
                            props: node.props,
                            children: processedChildren
                        } as any as ListNode;
                    case NodeType.Table:
                        return {
                            type: NodeType.Table,
                            props: node.props,
                            children: processedChildren
                        } as any as TableNode;
                    case NodeType.TableRow:
                        return {
                            type: NodeType.TableRow,
                            props: node.props,
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
                    case NodeType.Quote:
                    case NodeType.Bold:
                    case NodeType.Text:
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
        
        return {
            ...ast,
            children: traverse(ast.children)
        };
    }
};

export default LinkPlugin;