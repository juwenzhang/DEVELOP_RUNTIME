use super::ast::{AstNode, NodeType, create_root_node};
use super::plugin::{PluginManager, SyntaxPlugin}
use regex::Regex;

pub struct MdParser;

impl MdParser {
    pub fn parse(md_content: &str) -> AstNode {
        let mut root = create_root_node();  // create root node as the play init obj
        let lines = md_content.split("\n").filter(|line| !line.trim().is_empty());

        // record the regex expression for heading, bold, code
        // if you want to parse more markdown element, please add regex expression here, but I do not add more
        let heading_re = Regex::new(r"^#+\s+(.*)$").unwrap();
        let bold_re = Regex::new(r"\*\*(.*?)\*\*").unwrap();
        let code_re = Regex::new(r"`(.*?)`").unwrap();

        for line in lines {
            let line_trimed = line.trim();

            // begin process the content, if you have more time, you can define function to process them
            // but I want use If Expression to process them! HaHaHa!!!
            if let Some(cap) = heading_re.captures(line_trimed) {
                let heading_level = cap[1].len() as u8;
                let heading_text = cap[1].to_string();

                let mut heading_node = AstNode::new(NodeType::Heading(heading_level));
                let mut text_node = AstNode::new(NodeType::Text(heading_text));
                heading_node.add_children(text_node);
                root.add_children(heading_node);
                continue;
            }

            if let Some(cap) = bold_re.captures(line_trimed) {
                let bold_text = cap[1].to_string();
                let mut bold_node = AstNode::new(NodeType::Bold);
                let mut text_node = AstNode::new(NodeType::Text(bold_text));
                bold_node.add_children(text_node);
                root.add_children(bold_node);
                continue;
            }

            if let Some(cap) = code_re.captures(line_trimed) {
                let lang = cap[1].to_string();
                let code_text = cap[2].to_string();

                let mut code_node = AstNode::new(NodeType::Code(lang).clone());
                code_node.add_props("language", &lang);

                let mut text_node = AstNode::new(NodeType::Text(code_text));
                code_node.add_children(text_node);
                root.add_children(code_node);
                continue;
            }

            let mut text_node = AstNode::new(NodeType::Text(line_trimed.to_string()));
            root.add_children(text_node);
        }
    }

    pub fn parse_with_plugin(md_content: &str, plugin_manager: &PluginManager) -> AstNode {
        let mut root = create_root_node();
        let lines = md_content.split("\n").filter(|line| !line.trim().is_empty());

        let heading_re = Regex::new(r"^(#+)\s+(.*)").unwrap();
        let bold_re = Regex::new(r"^\*\*(.*)\*\*$").unwrap();

        for line in lines {
            let line_trimmed = line.trim();
            if let Some(plugin_node) = plugin_manager.try_parse(line_trimmed, md_content) {
                root.add_child(plugin_node);
                continue;
            }
            if heading_re.is_match(line_trimmed) {
                let cap = heading_re.captures(line_trimmed).unwrap();
                let heading_level = cap[1].len() as u8;
                let heading_text = cap[2].to_string();

                let mut heading_node = AstNode::new(NodeType::Heading(heading_level));
                let mut text_node = AstNode::new(NodeType::Text(heading_text));
                heading_node.add_children(text_node);
                root.add_children(heading_node);
            }
            else if bold_re.is_match(line_trimmed) {
                let cap = bold_re.captures(line_trimmed).unwrap();
                let bold_text = cap[1].to_string();

                let mut bold_node = AstNode::new(NodeType::Bold);
                let mut text_node = AstNode::new(NodeType::Text(bold_text));
                bold_node.add_children(text_node);
                root.add_children(bold_node);
            }
            else {
                let mut text_node = AstNode::new(NodeType::Text(line_trimmed.to_string()));
                root.add_children(text_node);
            }
        }
        root
    }
}
