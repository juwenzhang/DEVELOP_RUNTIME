use super::ast::AstNode;

pub trait SyntaxPlugin {
    fn name(&self) -> &'static str;

    fn matches(&self, line: &str, full_content: &str) -> bool;

    fn parse(&self, line: &str, full_content: &str) -> Option<AstNode>;
}

pub struct PluginManager {
    plugins: Vec<Box<dyn SyntaxPlugin>>,
}

impl PluginManager {
    pub fn new() -> Self {
        Self { plugins: Vec::new() }
    }

    pub fn register_plugin(&mut self, plugin: Box<dyn SyntaxPlugin>) {
        self.plugins.push(plugin);
    }

    pub fn try_parse(&self, line: &str, full_content: &str) -> Option<AstNode> {
        for plugin in &self.plugins {
            if plugin.matches(line, full_content) {
                return plugin.parse(line, full_content);
            }
        }
        None
    }
}
