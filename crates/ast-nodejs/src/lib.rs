use neon::prelude::*;
use ast_core::{parse_md_with_heading_ids, AstNode};

fn parse_md(mut cx: FunctionContext) -> JsResult<JsValue> {
    let md_content = cx.argument::<JsString>(0)?.value(&mut cx);
    let ast = parse_md_with_heading_ids(&md_content);
    let ast_json = serde_json::to_string(&ast).map_err(|e| {
        cx.throw_error(format!("AST 序列化失败：{}", e))
    })?;
    let js_ast = cx.eval::<JsValue, _>(&format!("JSON.parse('{}')", ast_json))?;

    Ok(js_ast)
}

#[neon::main]
fn main(mut cx: ModuleContext) -> NeonResult<()> {
    cx.export_function("parseMd", parse_md)?;
    Ok(())
}
