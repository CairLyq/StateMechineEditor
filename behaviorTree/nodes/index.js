/**
 * 行为树节点模块索引
 * Behavior Tree Nodes Index
 */

// 导入基础节点和枚举
// Import base node and enums

// 导入控制节点
// Import control nodes

// 导入装饰器节点
// Import decorator nodes

// 导入叶子节点
// Import leaf nodes

// 导入工厂
// Import factory

/**
 * 初始化所有节点模块
 * Initialize all node modules
 */
function initializeNodes() {
    // 检查所有必需的类是否已加载
    const requiredClasses = [
        'BaseNode', 'NodeStatus', 'NodeType',
        'RootNode', 'SelectorNode', 'SequenceNode', 'ParallelNode',
        'InverterNode', 'RepeaterNode',
        'ActionNode', 'ConditionNode',
        'NodeFactory'
    ];
    
    const missingClasses = requiredClasses.filter(className => 
        typeof window[className] === 'undefined'
    );
    
    if (missingClasses.length > 0) {
        console.warn('缺少以下节点类:', missingClasses);
        return false;
    }
    
    console.log('所有行为树节点类已成功加载');
    return true;
}

/**
 * 获取节点类型信息
 * Get node type information
 */
function getNodeTypeInfo() {
    return {
        // 特殊节点
        special: {
            name: '特殊节点',
            description: '特殊用途的节点',
            nodes: {
                [NodeType.ROOT]: {
                    name: '根节点',
                    class: 'RootNode',
                    icon: 'fas fa-tree',
                    color: '#FFC107',
                    description: '行为树的根节点，管理整个树的执行'
                }
            }
        },
        
        // 控制节点
        control: {
            name: '控制节点',
            description: '控制子节点执行流程的节点',
            nodes: {
                [NodeType.SELECTOR]: {
                    name: '选择器',
                    class: 'SelectorNode',
                    icon: 'fas fa-code-branch',
                    color: '#4CAF50',
                    description: '按顺序执行子节点，直到有一个成功'
                },
                [NodeType.SEQUENCE]: {
                    name: '序列器',
                    class: 'SequenceNode',
                    icon: 'fas fa-list-ol',
                    color: '#2196F3',
                    description: '按顺序执行子节点，直到有一个失败'
                },
                [NodeType.PARALLEL]: {
                    name: '并行器',
                    class: 'ParallelNode',
                    icon: 'fas fa-grip-lines',
                    color: '#FF9800',
                    description: '同时执行所有子节点，根据策略决定结果'
                }
            }
        },
        
        // 装饰器节点
        decorator: {
            name: '装饰器节点',
            description: '修饰或改变子节点行为的节点',
            nodes: {
                [NodeType.INVERTER]: {
                    name: '反转器',
                    class: 'InverterNode',
                    icon: 'fas fa-exclamation',
                    color: '#9C27B0',
                    description: '反转子节点的执行结果'
                },
                [NodeType.REPEATER]: {
                    name: '重复器',
                    class: 'RepeaterNode',
                    icon: 'fas fa-redo',
                    color: '#F44336',
                    description: '重复执行子节点指定次数或直到满足条件'
                }
            }
        },
        
        // 叶子节点
        leaf: {
            name: '叶子节点',
            description: '执行具体逻辑的终端节点',
            nodes: {
                [NodeType.ACTION]: {
                    name: '动作节点',
                    class: 'ActionNode',
                    icon: 'fas fa-play',
                    color: '#607D8B',
                    description: '执行具体的动作或行为'
                },
                [NodeType.CONDITION]: {
                    name: '条件节点',
                    class: 'ConditionNode',
                    icon: 'fas fa-question',
                    color: '#795548',
                    description: '检查某个条件是否满足'
                }
            }
        }
    };
}

/**
 * 创建节点实例
 * Create node instance
 */
function createNode(nodeType, name = '', id = null) {
    if (typeof nodeFactory !== 'undefined') {
        return nodeFactory.createNode(nodeType, name, id);
    }
    
    // 回退到直接创建
    const nodeInfo = getNodeTypeInfo();
    let nodeClass = null;
    
    // 查找节点类
    for (const category of Object.values(nodeInfo)) {
        if (category.nodes[nodeType]) {
            const className = category.nodes[nodeType].class;
            nodeClass = window[className];
            break;
        }
    }
    
    if (!nodeClass) {
        throw new Error(`未知的节点类型: ${nodeType}`);
    }
    
    return new nodeClass(name, id);
}

/**
 * 获取所有可用的节点类型
 * Get all available node types
 */
function getAllNodeTypes() {
    const types = [];
    const nodeInfo = getNodeTypeInfo();
    
    for (const category of Object.values(nodeInfo)) {
        types.push(...Object.keys(category.nodes));
    }
    
    return types;
}

/**
 * 检查节点类型是否可以有子节点
 * Check if node type can have children
 */
function canNodeHaveChildren(nodeType) {
    const specialNodes = [NodeType.ROOT];
    const controlNodes = [NodeType.SELECTOR, NodeType.SEQUENCE, NodeType.PARALLEL];
    const decoratorNodes = [NodeType.INVERTER, NodeType.REPEATER];
    
    return specialNodes.includes(nodeType) || controlNodes.includes(nodeType) || decoratorNodes.includes(nodeType);
}

/**
 * 验证节点树结构
 * Validate node tree structure
 */
function validateNodeTree(rootNode) {
    const errors = [];
    
    function validateNode(node, path = 'root') {
        if (!node) {
            errors.push(`${path}: 节点为空`);
            return;
        }
        
        // 验证节点类型
        if (!node.type || !getAllNodeTypes().includes(node.type)) {
            errors.push(`${path}: 无效的节点类型 "${node.type}"`);
        }
        
        // 验证叶子节点不能有子节点
        if (!canNodeHaveChildren(node.type) && node.children && node.children.length > 0) {
            errors.push(`${path}: 叶子节点不能有子节点`);
        }
        
        // 验证装饰器节点只能有一个子节点
        const decoratorNodes = [NodeType.INVERTER, NodeType.REPEATER];
        if (decoratorNodes.includes(node.type) && node.children && node.children.length > 1) {
            errors.push(`${path}: 装饰器节点只能有一个子节点`);
        }
        
        // 递归验证子节点
        if (node.children) {
            node.children.forEach((child, index) => {
                validateNode(child, `${path}.children[${index}]`);
            });
        }
    }
    
    validateNode(rootNode);
    
    return {
        isValid: errors.length === 0,
        errors
    };
}

// Node.js 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initializeNodes,
        getNodeTypeInfo,
        createNode,
        getAllNodeTypes,
        canNodeHaveChildren,
        validateNodeTree
    };
}

// 自动初始化（如果在浏览器环境中）
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    // 等待DOM加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeNodes);
    } else {
        // DOM已经加载完成
        setTimeout(initializeNodes, 100);
    }
} 