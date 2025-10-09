import {
    RootNode,
    Node,
    Plugin,
    ParagraphNode,
    ListNode,
    TableNode,
    TableRowNode
} from "../types/index";
import { NodeType } from "../types/index";

const ParagraphPlugin: Plugin = {
    name: "ParagraphPlugin",
    transform: (ast: RootNode): RootNode => {
        const traverse = (nodes: Node[]): Node[] => {
            return nodes.map(node => {
                const children = node.children || [];
                const processedChildren = traverse(children);
                
                switch (node.type) {
                    case NodeType.Paragraph:
                        return {
                            ...node,
                            children: processedChildren
                        } as ParagraphNode;
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
                    case NodeType.Quote:
                    case NodeType.Bold:
                    case NodeType.Text:
                    case NodeType.Link:
                    case NodeType.Image:
                    case NodeType.HorizontalRule:
                    case NodeType.CodeBlock:
                    case NodeType.Custom:
                    case NodeType.ListItem:
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

export default ParagraphPlugin;