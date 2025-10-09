import type {
    RootNode,
    Node,
    Plugin,
    TextNode
} from "../types/index";
import { NodeType } from "../types/index";
import RegExpMapper from "../constants/index";

const AllPlugin: Plugin = {
    name: "AllPlugin",
    transform: (ast: RootNode): RootNode => {
        const traverse = (nodes: Node[]): Node[] => {
            return nodes.map(node => {
                const children = node.children || [];
                const processedChildren = traverse(children);
                switch (node.type) {
                    case NodeType.Heading:
                        return {
                            ...node,
                            children: transformChildren(processedChildren, (child) => {
                                const value = isTextNode(child) 
                                    ? child.props.value.replace(RegExpMapper.HEADING, "") 
                                    : "";
                                return createTextNode(value);
                            })
                        };
                    case NodeType.Bold:
                        return {
                            ...node,
                            children: transformChildren(processedChildren, (child) => {
                                const value = isTextNode(child) 
                                    ? child.props.value.replace(RegExpMapper.BOLD, "$1") 
                                    : "";
                                return createTextNode(value);
                            })
                        };
                    case NodeType.Paragraph:
                        return {
                            ...node,
                            children: processedChildren
                        };
                    case NodeType.CodeBlock:
                        return {
                            ...node,
                            children: transformChildren(processedChildren, (child) => {
                                const value = isTextNode(child) 
                                    ? child.props.value.replace(RegExpMapper.CODE_BLOCK, "$1") 
                                    : "";
                                return createTextNode(value);
                            })
                        };
                    case NodeType.Text:
                        return node;
                    case NodeType.List:
                        const listItemChildren = processedChildren.filter(child => 
                            child.type === NodeType.ListItem
                        );
                        return {
                            ...node,
                            props: {
                                ...node.props,
                                ordered: node.props?.ordered || false
                            },
                            children: listItemChildren
                        };
                    case NodeType.ListItem:
                        return {
                            ...node,
                            children: processedChildren
                        };
                    
                    case NodeType.Quote:
                        return {
                            ...node,
                            children: transformChildren(processedChildren, (child) => {
                                const value = isTextNode(child) 
                                    ? child.props.value.replace(RegExpMapper.QUOTE, "") 
                                    : "";
                                return createTextNode(value);
                            })
                        };
                    
                    case NodeType.Link:
                        return {
                            ...node,
                            props: {
                                ...node.props,
                                href: node.props?.href || "#"
                            },
                            children: processedChildren
                        };
                    
                    case NodeType.Image:
                        return {
                            ...node,
                            props: {
                                ...node.props,
                                src: node.props?.src || "",
                                alt: node.props?.alt || ""
                            },
                            children: processedChildren
                        };
                    
                    case NodeType.Table:
                        const tableRowChildren = processedChildren.filter(child => 
                            child.type === NodeType.TableRow
                        );
                        return {
                            ...node,
                            props: {
                                ...node.props,
                                hasHeader: node.props?.hasHeader || false
                            },
                            children: tableRowChildren
                        };
                    
                    case NodeType.TableRow:
                            const tableCellChildren = processedChildren.filter(child => 
                                child.type === NodeType.TableCell
                            );
                            return {
                                ...node,
                                children: tableCellChildren
                            };
                        
                        case NodeType.TableCell:
                        case NodeType.HorizontalRule:
                        case NodeType.Custom:
                        return {
                            ...node,
                            children: processedChildren
                        };
                    
                    default:
                        console.warn(`Unknown node type: ${node.type} encountered in AllPlugin`);
                        return {
                            ...node,
                            children: processedChildren
                        };
                }
            });
        };
        
        const transformChildren = (
            children: Node[], 
            transformFn: (child: Node) => TextNode
        ): Node[] => {
            return children.map(transformFn);
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

export default AllPlugin;
