fn main() {
    // 模拟一下目录吧
    ast_core::ast::AstNode::dump("../../packages/ast-core-ts/src/types/ast.ts").unwrap();
    ast_core::ast::NodeType::dump("../../packages/ast-core-ts/src/types/ast.ts").unwrap();
}
