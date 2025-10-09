/**
 * 节点的类型常量
 */
export const NodeType = {
    Root: 'Root',  // 根节点
    Text: 'Text',  // 文本节点
    Paragraph: 'Paragraph',  // 段落节点
    Heading: 'Heading',  // 标题节点
    List: 'List',  // 列表节点
    ListItem: 'ListItem',  // 列表项节点
    CodeBlock: 'CodeBlock',  // 代码块节点
    Quote: 'Quote',  // 引用节点
    Link: 'Link',  // 链接节点
    Image: 'Image',  // 图片节点
    Table: 'Table',  // 表格节点
    TableRow: 'TableRow',  // 表格行节点
    TableCell: 'TableCell',  // 表格单元格节点
    HorizontalRule: 'HorizontalRule',  // 分隔线节点
    Custom: 'Custom',  // 自定义节点
    Bold: 'Bold'  // 加粗节点
} as const;

/**
 * 基础节点类型接口
 */
export interface BaseNode {
    type: typeof NodeType[keyof typeof NodeType];
    props?: Record<string, any>;
    children?: Node[];
}

/**
 * 根节点
 */
export interface RootNode extends BaseNode {
    type: typeof NodeType.Root;
    children: Node[];
}

/**
 * 文本节点类型接口
 */
export interface TextNode extends BaseNode {
    type: typeof NodeType.Text;
    props: {
        value: string;
        [key: string]: any;
    };
    children: Node[];
}

/**
 * 标题节点类型接口
 */
export interface HeadingNode extends BaseNode {
    type: typeof NodeType.Heading;
    props: {
        level: 1 | 2 | 3 | 4 | 5 | 6;
        [key: string]: any;
    };
    children: Node[];
}

/**
 * 段落节点类型接口
 */
export interface ParagraphNode extends BaseNode {
    type: typeof NodeType.Paragraph;
    children: Node[];
}

/**
 * 加粗节点类型接口
 */
export interface BoldNode extends BaseNode {
    type: typeof NodeType.Bold;
    children: Node[];
}

/**
 * 代码块节点类型接口
 */
export interface CodeBlockNode extends BaseNode {
    type: typeof NodeType.CodeBlock;
    props?: {
        language?: string | undefined;
        [key: string]: any;
    };
    children: Node[];
}

/**
 * 列表节点类型接口
 */
export interface ListNode extends BaseNode {
    type: typeof NodeType.List;
    props?: {
        ordered?: boolean;
        [key: string]: any;
    };
    children: ListItemNode[];
}

/**
 * 列表项节点类型接口
 */
export interface ListItemNode extends BaseNode {
    type: typeof NodeType.ListItem;
    children: Node[];
}

/**
 * 引用节点类型接口
 */
export interface QuoteNode extends BaseNode {
    type: typeof NodeType.Quote;
    children: Node[];
}

/**
 * 链接节点类型接口
 */
export interface LinkNode extends BaseNode {
    type: typeof NodeType.Link;
    props: {
        href: string;
        [key: string]: any;
    };
    children: Node[];
}

/**
 * 图片节点类型接口
 */
export interface ImageNode extends BaseNode {
    type: typeof NodeType.Image;
    props: {
        src: string;
        alt?: string;
        [key: string]: any;
    };
    children: Node[];
}

/**
 * 表格节点类型接口
 */
export interface TableNode extends BaseNode {
    type: typeof NodeType.Table;
    props?: {
        hasHeader?: boolean;
        [key: string]: any;
    };
    children: TableRowNode[];
}

/**
 * 表格行节点类型接口
 */
export interface TableRowNode extends BaseNode {
    type: typeof NodeType.TableRow;
    children: TableCellNode[];
}

/**
 * 表格单元格节点类型接口
 */
export interface TableCellNode extends BaseNode {
    type: typeof NodeType.TableCell;
    props?: {
        isHeader?: boolean;
        [key: string]: any;
    };
    children: Node[];
}

/**
 * 分隔线节点类型接口
 */
export interface HorizontalRuleNode extends BaseNode {
    type: typeof NodeType.HorizontalRule;
    children: Node[];
}

/**
 * 自定义节点类型接口
 */
export interface CustomNode extends BaseNode {
    type: typeof NodeType.Custom;
    props?: Record<string, any>;
    children: Node[];
}

/**
 * 所有节点类型的联合
 */
export type Node = 
    | RootNode 
    | HeadingNode 
    | ParagraphNode 
    | TextNode 
    | BoldNode 
    | CodeBlockNode 
    | ListNode 
    | ListItemNode 
    | QuoteNode 
    | LinkNode 
    | ImageNode 
    | TableNode 
    | TableRowNode 
    | TableCellNode 
    | HorizontalRuleNode 
    | CustomNode;

/**
 * 解析选项，github flavored markdown 语法进行解析实现吧
 */
export interface ParseOptions {
    gfm?: boolean;
}

export type Transformer = (ast: RootNode) => RootNode;

/**
 * 插件类型
 */
export interface Plugin {
    name: string;
    transform?: Transformer;
}

/**
 * 生成选项
 */
// 注意让用户获取得到数据永远比你的处理数据的方法更重要呐
// 因为用户获取得到数据后就可以根据数据进行任意的操作了，实现个性化的适配
export interface GenerateOptions {
    format: 'html' | 'json';
}
