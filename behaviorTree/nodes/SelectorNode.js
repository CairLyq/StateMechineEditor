/**
 * 选择器节点 - Selector Node
 * 按顺序执行子节点，直到有一个返回SUCCESS或RUNNING
 */
class SelectorNode extends BaseNode {
    constructor(name = '', id = null) {
        super(NodeType.SELECTOR, name, id);
        this.currentChildIndex = 0;
    }

    /**
     * 获取默认属性
     */
    getDefaultProperties() {
        return {
            // 选择器特有属性
            randomOrder: false,        // 是否随机顺序执行
            memoryType: 'none',        // 记忆类型：none, selective, full
            priority: 'order',         // 优先级类型：order, weight, dynamic
            weights: [],               // 子节点权重（当priority为weight时使用）
            
            // 通用属性
            description: '选择器节点：按顺序执行子节点，直到有一个成功',
            tooltip: '选择器会依次尝试执行子节点，直到找到一个成功的节点'
        };
    }

    /**
     * 初始化节点
     */
    initializeNode() {
        this.currentChildIndex = 0;
        this.executionOrder = [];
        this.childWeights = new Map();
    }

    /**
     * 执行选择器逻辑
     */
    execute(context = {}) {
        super.execute(context);
        
        if (this.children.length === 0) {
            this.status = NodeStatus.FAILURE;
            return this.status;
        }

        // 处理随机顺序
        if (this.properties.randomOrder && this.executionOrder.length === 0) {
            this.executionOrder = this.shuffleArray([...Array(this.children.length).keys()]);
        } else if (!this.properties.randomOrder) {
            this.executionOrder = [...Array(this.children.length).keys()];
        }

        // 处理权重优先级
        if (this.properties.priority === 'weight') {
            this.executionOrder = this.sortByWeights();
        }

        // 从当前索引开始执行
        for (let i = this.currentChildIndex; i < this.children.length; i++) {
            const childIndex = this.executionOrder[i];
            const child = this.children[childIndex];
            
            if (!child) continue;

            const result = child.execute(context);
            
            // 记录执行信息
            this.logExecution(`执行子节点 ${child.name}: ${result}`, context);
            
            if (result === NodeStatus.SUCCESS) {
                this.status = NodeStatus.SUCCESS;
                this.currentChildIndex = 0; // 重置索引
                return this.status;
            } else if (result === NodeStatus.RUNNING) {
                this.status = NodeStatus.RUNNING;
                this.currentChildIndex = i; // 记住当前位置
                return this.status;
            }
            // FAILURE 继续下一个子节点
        }

        // 所有子节点都失败了
        this.status = NodeStatus.FAILURE;
        this.currentChildIndex = 0;
        return this.status;
    }

    /**
     * 重置节点状态
     */
    reset() {
        super.reset();
        this.currentChildIndex = 0;
        this.executionOrder = [];
    }

    /**
     * 随机打乱数组
     */
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    /**
     * 按权重排序
     */
    sortByWeights() {
        const weights = this.properties.weights || [];
        const indices = [...Array(this.children.length).keys()];
        
        return indices.sort((a, b) => {
            const weightA = weights[a] || 1;
            const weightB = weights[b] || 1;
            return weightB - weightA; // 降序排列
        });
    }

    /**
     * 记录执行日志
     */
    logExecution(message, context) {
        if (context.logger) {
            context.logger.log('selector', message, this.id);
        }
    }

    /**
     * 获取属性配置界面
     */
    getPropertyConfig() {
        return {
            title: '选择器节点配置',
            properties: [
                {
                    key: 'randomOrder',
                    label: '随机顺序',
                    type: 'boolean',
                    value: this.properties.randomOrder,
                    description: '是否随机顺序执行子节点'
                },
                {
                    key: 'memoryType',
                    label: '记忆类型',
                    type: 'select',
                    value: this.properties.memoryType,
                    options: [
                        { value: 'none', label: '无记忆' },
                        { value: 'selective', label: '选择性记忆' },
                        { value: 'full', label: '完全记忆' }
                    ],
                    description: '节点的记忆行为类型'
                },
                {
                    key: 'priority',
                    label: '优先级类型',
                    type: 'select',
                    value: this.properties.priority,
                    options: [
                        { value: 'order', label: '按顺序' },
                        { value: 'weight', label: '按权重' },
                        { value: 'dynamic', label: '动态优先级' }
                    ],
                    description: '子节点的执行优先级类型'
                },
                {
                    key: 'weights',
                    label: '子节点权重',
                    type: 'array',
                    value: this.properties.weights,
                    description: '各子节点的权重值（仅在权重优先级下生效）',
                    visible: () => this.properties.priority === 'weight'
                },
                {
                    key: 'description',
                    label: '描述',
                    type: 'textarea',
                    value: this.properties.description,
                    description: '节点的详细描述'
                }
            ]
        };
    }

    /**
     * 验证节点配置
     */
    validate() {
        const errors = [];
        
        if (this.children.length === 0) {
            errors.push('选择器节点至少需要一个子节点');
        }

        if (this.properties.priority === 'weight') {
            const weights = this.properties.weights || [];
            if (weights.length !== this.children.length) {
                errors.push('权重数量必须与子节点数量匹配');
            }
            
            const invalidWeights = weights.filter(w => typeof w !== 'number' || w < 0);
            if (invalidWeights.length > 0) {
                errors.push('权重必须是非负数');
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * 获取调试信息
     */
    getDebugInfo() {
        return {
            type: 'Selector',
            currentChildIndex: this.currentChildIndex,
            executionOrder: this.executionOrder,
            childCount: this.children.length,
            properties: this.properties
        };
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SelectorNode;
} else if (typeof window !== 'undefined') {
    window.SelectorNode = SelectorNode;
} 