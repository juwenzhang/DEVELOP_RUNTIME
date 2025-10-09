import type {
    RootNode,
    Node,
    Plugin,
    ListNode,
    ListItemNode,
    TableNode,
    TableRowNode,
    TableCellNode
} from "../types/index";
import { NodeType } from "../types/index";

const ListPlugin: Plugin = {
    name: "ListPlugin",
    transform: (ast: RootNode): RootNode => {
        const traverse = (nodes: Node[]): Node[] => {
            return nodes.map(node => {
                const children = node.children || [];
                const processedChildren = traverse(children);
                
                if (node.type === NodeType.List) {
                    const listItemChildren = processedChildren.filter((child): child is ListItemNode => 
                        child.type === NodeType.ListItem
                    );
                    
                    const listNode: ListNode = {
                        type: NodeType.List,
                        props: {
                            ...node.props,
                            ordered: node.props?.ordered ?? false
                        },
                        children: listItemChildren
                    };
                    return listNode;
                }
                
                switch (node.type) {
                    case NodeType.Root:
                        return {
                            type: NodeType.Root,
                            children: processedChildren
                        };
                    case NodeType.Text:
                        return {
                            type: NodeType.Text,
                            props: {
                                ...node.props,
                                value: node.props?.value ?? ""
                            },
                            children: processedChildren
                        };
                    case NodeType.Paragraph:
                        return {
                            type: NodeType.Paragraph,
                            children: processedChildren
                        };
                    case NodeType.Heading:
                        return {
                            type: NodeType.Heading,
                            props: {
                                ...node.props,
                                level: node.props?.level ?? 1
                            },
                            children: processedChildren
                        };
                    case NodeType.ListItem:
                        return {
                            type: NodeType.ListItem,
                            children: processedChildren
                        };
                    case NodeType.CodeBlock:
                        return {
                            type: NodeType.CodeBlock,
                            props: {
                                ...node.props,
                                language: node.props?.language ?? ""
                            },
                            children: processedChildren
                        };
                    case NodeType.Quote:
                        return {
                            type: NodeType.Quote,
                            children: processedChildren
                        };
                    case NodeType.Link:
                        return {
                            type: NodeType.Link,
                            props: {
                                ...node.props,
                                href: node.props?.href ?? "#"
                            },
                            children: processedChildren
                        };
                    case NodeType.Image:
                        return {
                            type: NodeType.Image,
                            props: {
                                ...node.props,
                                src: node.props?.src ?? "",
                                alt: node.props?.alt ?? ""
                            },
                            children: processedChildren
                        };
                    case NodeType.Table:
                        const tableRowChildren: TableRowNode[] = processedChildren.filter((child): child is TableRowNode => 
                            child.type === NodeType.TableRow
                        );
                        return {
                            type: NodeType.Table,
                            props: {
                                ...node.props,
                                hasHeader: node.props?.hasHeader ?? false
                            },
                            children: tableRowChildren
                        } as TableNode;
                    case NodeType.TableRow:
                        const tableCellChildren: TableCellNode[] = processedChildren.filter((child): child is TableCellNode => 
                            child.type === NodeType.TableCell
                        );
                        return {
                            type: NodeType.TableRow,
                            children: tableCellChildren
                        } as TableRowNode;
                    case NodeType.TableCell:
                        return {
                            type: NodeType.TableCell,
                            props: {
                                ...node.props,
                                isHeader: node.props?.isHeader ?? false
                            },
                            children: processedChildren
                        };
                    case NodeType.HorizontalRule:
                        return {
                            type: NodeType.HorizontalRule,
                            children: processedChildren
                        };
                    case NodeType.Custom:
                        return {
                            type: NodeType.Custom,
                            props: {
                                ...node.props
                            },
                            children: processedChildren
                        };
                    case NodeType.Bold:
                        return {
                            type: NodeType.Bold,
                            children: processedChildren
                        };
                    default:
                        return {
                            type: (node as any).type,
                            props: (node as any).props,
                            children: processedChildren
                        } as Node;
                };
            });
        };
        
        return {
            type: NodeType.Root,
            children: traverse(ast.children)
        };
    }
};

export default ListPlugin;
