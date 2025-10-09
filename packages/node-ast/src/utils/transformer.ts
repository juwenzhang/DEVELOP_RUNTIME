import type { 
    RootNode, 
    Plugin 
} from "../types/index";

class NodeAstTransformer {
    private plugins: Plugin[] = [];

    public use(plugin: Plugin) {
        if (this.plugins.find(
            p => p.name === plugin.name
        )) {
            console.warn(`Plugin ${plugin.name} has been registered`);
            return;
        }
        this.plugins.push(plugin);
    }

    // transform the ast from the RootNode
    // and return the transformed ast
    public transform(ast: RootNode): RootNode {
        let transformAST = {
            ...ast
        }
        this.plugins.forEach(plugin => {
            if (plugin.transform) {
                transformAST = plugin.transform(transformAST);
            }
        })
        return transformAST;
    }
}

export default NodeAstTransformer;
export {
    NodeAstTransformer
}
