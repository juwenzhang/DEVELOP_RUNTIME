import type { 
    RootNode,
    Transformer,
    Node,
    Plugin 
} from "../types/index";

export interface RRatConfig {
    rule: {
        nodeType: string,
        props: Record<string, any>
    },
    transform: (node: Node) => Node | Transformer
}

class NodeAstTransformer {
    private plugins: Plugin[] = [];
    private rRatConfigs: RRatConfig[] = []; // R-Rat 扩展吧

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
        const applyRRatTransform = (node: Node): Node => {
            const newNode = {
                ...node,
                children: node.children ? [...node.children] : []
            }
            this.rRatConfigs.forEach(rRatConfig => {
                const typeMatch = newNode.type == rRatConfig.rule.nodeType;
                const propsMatch = !rRatConfig.rule.props || Object
                    .keys(rRatConfig.rule.props)
                    .every(([key, value]) => newNode.props?.[key as any] === value);
                if (typeMatch && propsMatch) {
                    Object.assign(newNode, rRatConfig.transform(newNode as Node));
                }
            })
            if (newNode.children) {
                newNode.children = newNode.children.map(child => applyRRatTransform(child));
            }
            return newNode as Node;
        }

        transformAST.children = transformAST.children.map(child => applyRRatTransform(child));
        return transformAST;
    }

    loadRRatConfig(config: RRatConfig): void {
        let rRatConfig: RRatConfig;
        if (typeof config === 'string') {
            try {
                rRatConfig = JSON.parse(config);
            }
            catch (error) {
                console.error(`Error loading R-Rat config: ${error}`);
                return;
            }
        }
        else {
            rRatConfig = config;
        }
        if (!rRatConfig.rule.nodeType || typeof rRatConfig.transform !== 'function') {
            console.error(`Invalid R-Rat config: ${JSON.stringify(rRatConfig)}`);
        }
        this.rRatConfigs.push(rRatConfig);
    }
}

export default NodeAstTransformer;
export {
    NodeAstTransformer
}
