import type {
    RootNode,
    Node,
    Plugin,
    TableNode,
    TableRowNode,
    TableCellNode,
    ListNode,
    ListItemNode
} from "../types/index";
import { NodeType } from "../types/index";

const TablePlugin: Plugin = {
    name: "TablePlugin",
    transform: (ast: RootNode): RootNode => {
        const traverse = (nodes: Node[]): Node[] => {
            return nodes.map(node => {
                const children = node.children || [];
                const processedChildren = traverse(children);
                
                switch (node.type) {
                    case NodeType.Table:
                        const tableRowChildren = processedChildren.filter((child): child is TableRowNode => 
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
                    
                    case NodeType.List:
                        const listItemChildren = processedChildren.filter((child): child is ListItemNode => 
                            child.type === NodeType.ListItem
                        );
                        return {
                            type: NodeType.List,
                            props: node.props,
                            children: listItemChildren
                        } as ListNode;
                    
                    case NodeType.TableRow:
                        const tableCellChildren = processedChildren.filter((child): child is TableCellNode => 
                            child.type === NodeType.TableCell
                        );
                        return {
                            type: NodeType.TableRow,
                            children: tableCellChildren
                        } as TableRowNode;
                    
                    case NodeType.Root:
                        return {
                            type: NodeType.Root,
                            children: processedChildren
                        } as RootNode;
                    
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
            type: NodeType.Root,
            children: traverse(ast.children)
        } as RootNode;
    }
};

export default TablePlugin;