use super::ast::AstNode;
use std::borrow::Cow;

pub struct AstTransformer;

impl AstTransformer {
    // add unique id information into every node
    pub fn add_heading_unique_id(root: &mut AstNode) {
        Self::traverse(root, |node| {
            if let super::ast::NodeType::Heading(_) = &node.node_type {
                if let Some(text_child)= node.children.first() {
                    if let super::ast::NodeType::Text(content) = &text_child.node_type {
                        let id = content
                            .to_lowercase()
                            .replace(|c: char| !c.is_alphanumeric() && c != ' ', "-")
                            .replace("--", "-")
                            .trim_matches('-')
                            .to_string();
                        node.add_prop("id", &id);
                    }
                }
            }
        })
    }

    // impl traverse function, help to process the node
    fn traverse(node: &mut AstNode, handler: impl Fn(&mut AstNode)) {
        handler(node);
        // process node by recursively
        for child in node.children.iter_mut() {
            Self::traverse(child, handler);
        }
    }
}
