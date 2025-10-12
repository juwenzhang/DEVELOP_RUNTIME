use super::super::ast::{AstNode, NodeType};
use super::SyntaxPlugin;
use regex::Regex;

pub struct WarningPlugin {
    regex: Regex
}

impl WarningPlugin {
    pub fn new() -> Self {
        let regex = Regex::new(r":::warning\s*(.*?)\n([\s\S]*?)\n:::").unwrap();
        Self { regex }
    }
}

impl SyntaxPlugin for WarningPlugin {
    fn name(&self) -> &'static str {
        "warning-plugin"
    }

    fn matches(&self, _line: &str, full_content: &str) -> bool {
        self.regex.is_match(full_content)
    }

    fn parse(&self, _line: &str, full_content: &str) -> Option<AstNode> {
        if let Some(cap) = self.regex.captures(full_content) {
            let title = cap[1].to_string();
            let content = cap[2].to_string();

            let mut warning_node = AstNode::new(NodeType::Text("Warning".to_string()));
            warning_node.add_prop("type", "warning");

            let mut title_node = AstNode::new(NodeType::Text(title));
            title_node.add_prop("class", "warning-title");
            warning_node.add_child(title_node);

            let mut content_node = AstNode::new(NodeType::Text(content));
            content_node.add_prop("class", "warning-content");
            warning_node.add_child(content_node);

            Some(warning_node)
        } else {
            None
        }
    }
}
