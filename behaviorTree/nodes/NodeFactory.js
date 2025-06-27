/**
 * 节点工厂 - Node Factory
 * 用于创建和管理所有类型的行为树节点
 */
class NodeFactory {
    constructor() {
        this.nodeClasses = new Map();
        this.registerDefaultNodes();
    }

    /**
     * 注册默认节点类型
     */
    registerDefaultNodes() {
        // 特殊节点
        this.registerNode(NodeType.ROOT, RootNode);
        
        // 控制节点
        this.registerNode(NodeType.SELECTOR, SelectorNode);
        this.registerNode(NodeType.SEQUENCE, SequenceNode);
        this.registerNode(NodeType.PARALLEL, ParallelNode);
        
        // 装饰器节点
        this.registerNode(NodeType.INVERTER, InverterNode);
        this.registerNode(NodeType.REPEATER, RepeaterNode);
        
        // 叶子节点
        this.registerNode(NodeType.ACTION, ActionNode);
        this.registerNode(NodeType.CONDITION, ConditionNode);
    }

    /**
     * 注册节点类型
     */
    registerNode(nodeType, nodeClass) {
        if (!nodeType || !nodeClass) {
            throw new Error('节点类型和节点类都不能为空');
        }
        
        this.nodeClasses.set(nodeType, nodeClass);
    }

    /**
     * 创建节点
     */
    createNode(nodeType, name = '', id = null) {
        const NodeClass = this.nodeClasses.get(nodeType);
        
        if (!NodeClass) {
            throw new Error(`未知的节点类型: ${nodeType}`);
        }
        
        const node = new NodeClass(name, id);
        
        // 设置默认名称
        if (!name) {
            node.name = this.getDefaultNodeName(nodeType);
        }
        
        return node;
    }

    /**
     * 获取默认节点名称
     */
    getDefaultNodeName(nodeType) {
        const nameMap = {
            [NodeType.ROOT]: '根节点',
            [NodeType.SELECTOR]: '选择器',
            [NodeType.SEQUENCE]: '序列器',
            [NodeType.PARALLEL]: '并行器',
            [NodeType.INVERTER]: '反转器',
            [NodeType.REPEATER]: '重复器',
            [NodeType.ACTION]: '动作',
            [NodeType.CONDITION]: '条件'
        };
        
        return nameMap[nodeType] || '未知节点';
    }

    /**
     * 获取节点图标
     */
    getNodeIcon(nodeType) {
        const iconMap = {
            [NodeType.ROOT]: 'fas fa-tree',
            [NodeType.SELECTOR]: 'fas fa-code-branch',
            [NodeType.SEQUENCE]: 'fas fa-list-ol',
            [NodeType.PARALLEL]: 'fas fa-grip-lines',
            [NodeType.INVERTER]: 'fas fa-exclamation',
            [NodeType.REPEATER]: 'fas fa-redo',
            [NodeType.ACTION]: 'fas fa-play',
            [NodeType.CONDITION]: 'fas fa-question'
        };
        
        return iconMap[nodeType] || 'fas fa-circle';
    }

    /**
     * 获取节点颜色
     */
    getNodeColor(nodeType) {
        const colorMap = {
            [NodeType.ROOT]: '#FFC107',          // 金色
            [NodeType.SELECTOR]: '#4CAF50',      // 绿色
            [NodeType.SEQUENCE]: '#2196F3',      // 蓝色
            [NodeType.PARALLEL]: '#FF9800',      // 橙色
            [NodeType.INVERTER]: '#9C27B0',      // 紫色
            [NodeType.REPEATER]: '#F44336',      // 红色
            [NodeType.ACTION]: '#607D8B',        // 蓝灰色
            [NodeType.CONDITION]: '#795548'      // 棕色
        };
        
        return colorMap[nodeType] || '#757575';
    }

    /**
     * 获取节点描述
     */
    getNodeDescription(nodeType) {
        const descriptionMap = {
            [NodeType.ROOT]: '行为树的根节点，管理整个树的执行',
            [NodeType.SELECTOR]: '按顺序执行子节点，直到有一个成功',
            [NodeType.SEQUENCE]: '按顺序执行子节点，直到有一个失败',
            [NodeType.PARALLEL]: '同时执行所有子节点，根据策略决定结果',
            [NodeType.INVERTER]: '反转子节点的执行结果',
            [NodeType.REPEATER]: '重复执行子节点指定次数或直到满足条件',
            [NodeType.ACTION]: '执行具体的动作或行为',
            [NodeType.CONDITION]: '检查某个条件是否满足'
        };
        
        return descriptionMap[nodeType] || '未知节点类型';
    }

    /**
     * 获取所有可用的节点类型
     */
    getAvailableNodeTypes() {
        return Array.from(this.nodeClasses.keys());
    }

    /**
     * 获取节点类型分类
     */
    getNodeCategories() {
        return {
            special: {
                name: '特殊节点',
                types: [NodeType.ROOT]
            },
            control: {
                name: '控制节点',
                types: [NodeType.SELECTOR, NodeType.SEQUENCE, NodeType.PARALLEL]
            },
            decorator: {
                name: '装饰器节点',
                types: [NodeType.INVERTER, NodeType.REPEATER]
            },
            leaf: {
                name: '叶子节点',
                types: [NodeType.ACTION, NodeType.CONDITION]
            }
        };
    }

    /**
     * 检查节点类型是否可以有子节点
     */
    canHaveChildren(nodeType) {
        const specialNodes = [NodeType.ROOT];
        const controlNodes = [NodeType.SELECTOR, NodeType.SEQUENCE, NodeType.PARALLEL];
        const decoratorNodes = [NodeType.INVERTER, NodeType.REPEATER];
        
        return specialNodes.includes(nodeType) || controlNodes.includes(nodeType) || decoratorNodes.includes(nodeType);
    }

    /**
     * 检查节点类型是否是叶子节点
     */
    isLeafNode(nodeType) {
        const leafNodes = [NodeType.ACTION, NodeType.CONDITION];
        return leafNodes.includes(nodeType);
    }

    /**
     * 创建节点的配置数据
     */
    createNodeConfig(nodeType) {
        return {
            type: nodeType,
            name: this.getDefaultNodeName(nodeType),
            icon: this.getNodeIcon(nodeType),
            color: this.getNodeColor(nodeType),
            description: this.getNodeDescription(nodeType),
            canHaveChildren: this.canHaveChildren(nodeType),
            isLeafNode: this.isLeafNode(nodeType)
        };
    }

    /**
     * 从数据创建节点
     */
    createNodeFromData(data) {
        const node = this.createNode(data.type, data.name, data.id);
        
        // 设置属性
        if (data.properties) {
            Object.assign(node.properties, data.properties);
        }
        
        // 设置位置
        if (data.x !== undefined && data.y !== undefined) {
            node.x = data.x;
            node.y = data.y;
        }
        
        // 递归创建子节点
        if (data.children && data.children.length > 0) {
            for (const childData of data.children) {
                const childNode = this.createNodeFromData(childData);
                node.addChild(childNode);
            }
        }
        
        return node;
    }

    /**
     * 将节点转换为数据
     */
    nodeToData(node) {
        const data = {
            id: node.id,
            type: node.type,
            name: node.name,
            x: node.x,
            y: node.y,
            properties: { ...node.properties }
        };
        
        // 递归转换子节点
        if (node.children && node.children.length > 0) {
            data.children = node.children.map(child => this.nodeToData(child));
        }
        
        return data;
    }

    /**
     * 验证节点数据
     */
    validateNodeData(data) {
        const errors = [];
        
        if (!data.type) {
            errors.push('节点类型不能为空');
        } else if (!this.nodeClasses.has(data.type)) {
            errors.push(`未知的节点类型: ${data.type}`);
        }
        
        if (!data.name || data.name.trim() === '') {
            errors.push('节点名称不能为空');
        }
        
        if (typeof data.x !== 'number' || typeof data.y !== 'number') {
            errors.push('节点位置必须是数字');
        }
        
        // 递归验证子节点
        if (data.children) {
            for (let i = 0; i < data.children.length; i++) {
                const childErrors = this.validateNodeData(data.children[i]);
                if (childErrors.length > 0) {
                    errors.push(`子节点 ${i + 1}: ${childErrors.join(', ')}`);
                }
            }
        }
        
        return errors;
    }

    /**
     * 克隆节点
     */
    cloneNode(node) {
        const data = this.nodeToData(node);
        // 生成新的ID
        data.id = this.generateNodeId();
        this.assignNewIds(data);
        
        return this.createNodeFromData(data);
    }

    /**
     * 为节点数据分配新的ID
     */
    assignNewIds(data) {
        data.id = this.generateNodeId();
        
        if (data.children) {
            for (const child of data.children) {
                this.assignNewIds(child);
            }
        }
    }

    /**
     * 生成节点ID
     */
    generateNodeId() {
        return 'node_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * 获取节点统计信息
     */
    getNodeStatistics(rootNode) {
        const stats = {
            totalNodes: 0,
            nodesByType: {},
            maxDepth: 0,
            leafNodes: 0
        };
        
        this.collectNodeStats(rootNode, stats, 0);
        
        return stats;
    }

    /**
     * 收集节点统计信息
     */
    collectNodeStats(node, stats, depth) {
        if (!node) return;
        
        stats.totalNodes++;
        stats.maxDepth = Math.max(stats.maxDepth, depth);
        
        // 按类型统计
        if (!stats.nodesByType[node.type]) {
            stats.nodesByType[node.type] = 0;
        }
        stats.nodesByType[node.type]++;
        
        // 叶子节点统计
        if (!node.children || node.children.length === 0) {
            stats.leafNodes++;
        }
        
        // 递归统计子节点
        if (node.children) {
            for (const child of node.children) {
                this.collectNodeStats(child, stats, depth + 1);
            }
        }
    }
}

// 创建全局实例
const nodeFactory = new NodeFactory();

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { NodeFactory, nodeFactory };
} else if (typeof window !== 'undefined') {
    window.NodeFactory = NodeFactory;
    window.nodeFactory = nodeFactory;
} 