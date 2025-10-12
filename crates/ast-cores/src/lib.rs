pub mod ast;
pub mod parser;
pub mod transformer;

pub use ast::{AstNode, AstTransformer, create_root_node};
pub use parser::MdParser;
pub use transformer::AstTransformer;

pub fn parse_md_with_heading_ids(md_content: &str) -> AstNode {
    let mut ast = MdParser::parse(md_content);
    AstTransformer::add_heading_unique_id(&mut ast);
    ast
}
