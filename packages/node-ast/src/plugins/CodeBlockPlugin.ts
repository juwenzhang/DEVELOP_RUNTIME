import {
    RootNode,
    Node,
    Plugin,
    TextNode,
    CodeBlockNode,
    ListNode,
    TableNode,
    TableRowNode
} from "../types/index";
import { NodeType } from "../types/index";
import RegExpMapper from "../constants/index";

const CodeBlockPlugin: Plugin = {
    name: "CodeBlockPlugin",
    transform: (ast: RootNode): RootNode => {
        const traverse = (nodes: Node[]): Node[] => {
            return nodes.map(node => {
                const children = node.children || [];
                const processedChildren = traverse(children);
                
                switch (node.type) {
                    case NodeType.CodeBlock:
                        return {
                            type: NodeType.CodeBlock,
                            props: {
                                ...node.props,
                                language: node.props?.language ?? ""
                            },
                            children: transformCodeBlockChildren(processedChildren)
                        } as CodeBlockNode;
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
        
        const transformCodeBlockChildren = (children: Node[]): Node[] => {
            return children.map(child => {
                if (isTextNode(child)) {
                    const match = child.props.value.match(RegExpMapper.CODE_BLOCK);
                    const value = match ? match[1] : child.props.value;
                    return createTextNode(value || "") as TextNode;
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

export default CodeBlockPlugin;