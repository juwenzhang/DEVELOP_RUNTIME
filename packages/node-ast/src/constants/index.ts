/**
 * 正则表达式映射，用于解析不同类型的 mdcontent 呐，哈哈
 */
const RegExpMapper = {
    HEADING: /^#{1,6}\s+/,  
    
    BOLD: /^\*\*(.*?)\*\*$/,  
    
    PARAGRAPH: /^[^\n]+$/,  
    
    CODE_BLOCK: /^```\n([\s\S]*?)```$/,  
    
    CODE_BLOCK_LANG: /^```(\w+)\n([\s\S]*?)```$/,  
    
    TEXT: /^[^\n]+$/,  
    
    LIST_UNORDERED_ITEM: /^[\-+\*]\s+/,  
    
    LIST_ORDERED_ITEM: /^\d+\.\s+/,  
    
    QUOTE: /^>\s+/,  
    
    LINK: /\[(.*?)\]\((.*?)\)/,  
    
    IMAGE: /!\[(.*?)\]\((.*?)\)/,  
    
    HORIZONTAL_RULE: /^[\-*_]{3,}\s*$/,  
    
    TABLE_ROW: /^\|.*\|$/,  
    
    TABLE_SEPARATOR: /^\|(?:\s*-+\s*\|)+$/
};

export default RegExpMapper;
