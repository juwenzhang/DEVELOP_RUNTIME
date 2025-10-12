// 开始定义类型吧
use serde::{Serialize, Deserialize};
use std::collections::HashMap;
use ts_rs::TS;

#[derive(Debug, Serialize, Deserialize)]
#[ts(export)]
pub enum NodeType {
    Root,
    Heading(u8),
    Bold,
    Text(String),
    Code(String)
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[ts(export)]
pub struct AstNode {
    pub node_type: NodeType,
    pub props: HashMap<String, String>,
    pub children: Vec<AstNode>,
}

/// 为 AstNode 实现一些方法吧
/// 只是简单实现一下吧，毕竟对 rust 熟悉程度也就那样
/// 小小小小白
impl AstNode {
    pub fn new(node_type: NodeType) -> Self {
        Self {
            node_type,
            props: HashMap::new(),
            children: Vec::new(),
        }
    }

    pub fn add_props(&mut self, key: &str, value: &str) {
        self.props.insert(key.to_string(), value.to_string());
    }

    pub fn add_children(&mut self, child: AstNode) {
        self.children.push(child);
    }
}

pub fn create_root_node() -> AstNode {
    AstNode::new(NodeType::Root)
}
