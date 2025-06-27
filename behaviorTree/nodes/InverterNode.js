/**
 * 反转器节点 - Inverter Node
 * 反转子节点的执行结果：SUCCESS变FAILURE，FAILURE变SUCCESS
 */
class InverterNode extends BaseNode {
    constructor(name = '', id = null) {
        super(NodeType.INVERTER, name, id);
    }

    /**
     * 获取默认属性
     */
    getDefaultProperties() {
        return {
            // 反转器特有属性
            invertRunning: false,      // 是否反转RUNNING状态
            invertError: false,        // 是否反转ERROR状态
            
            // 通用属性
            description: '反转器节点：反转子节点的执行结果',
            tooltip: '反转器会将子节点的成功变为失败，失败变为成功'
        };
    }

    /**
     * 执行反转器逻辑
     */
    execute(context = {}) {
        super.execute(context);
        
        if (this.children.length === 0) {
            this.status = NodeStatus.FAILURE;
            return this.status;
        }

        if (this.children.length > 1) {
            this.logExecution('警告：反转器节点只能有一个子节点，将执行第一个', context);
        }

        const child = this.children[0];
        const result = child.execute(context);
        
        // 记录执行信息
        this.logExecution(`子节点执行结果: ${result}, 反转后: ${this.invertResult(result)}`, context);
        
        this.status = this.invertResult(result);
        return this.status;
    }

    /**
     * 反转执行结果
     */
    invertResult(result) {
        switch (result) {
            case NodeStatus.SUCCESS:
                return NodeStatus.FAILURE;
            
            case NodeStatus.FAILURE:
                return NodeStatus.SUCCESS;
            
            case NodeStatus.RUNNING:
                return this.properties.invertRunning ? NodeStatus.FAILURE : NodeStatus.RUNNING;
            
            case NodeStatus.ERROR:
                return this.properties.invertError ? NodeStatus.SUCCESS : NodeStatus.ERROR;
            
            default:
                return result;
        }
    }

    /**
     * 检查是否可以有子节点
     */
    canHaveChildren() {
        return true; // 装饰器节点可以有子节点
    }

    /**
     * 记录执行日志
     */
    logExecution(message, context) {
        if (context.logger) {
            context.logger.log('inverter', message, this.id);
        }
    }

    /**
     * 获取属性配置界面
     */
    getPropertyConfig() {
        return {
            title: '反转器节点配置',
            properties: [
                {
                    key: 'invertRunning',
                    label: '反转运行状态',
                    type: 'boolean',
                    value: this.properties.invertRunning,
                    description: '是否将RUNNING状态反转为FAILURE'
                },
                {
                    key: 'invertError',
                    label: '反转错误状态',
                    type: 'boolean',
                    value: this.properties.invertError,
                    description: '是否将ERROR状态反转为SUCCESS'
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
            errors.push('反转器节点需要一个子节点');
        }
        
        if (this.children.length > 1) {
            errors.push('反转器节点只能有一个子节点');
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
            type: 'Inverter',
            childCount: this.children.length,
            properties: this.properties,
            lastChildResult: this.children[0]?.status || 'none'
        };
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = InverterNode;
} else if (typeof window !== 'undefined') {
    window.InverterNode = InverterNode;
} 