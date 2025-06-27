/**
 * 条件节点 - Condition Node
 * 检查某个条件是否满足
 */
class ConditionNode extends BaseNode {
    constructor(name = '', id = null) {
        super(NodeType.CONDITION, name, id);
    }

    /**
     * 获取默认属性
     */
    getDefaultProperties() {
        return {
            // 条件特有属性
            conditionType: 'custom',       // 条件类型：custom, distance, health, variable, property
            conditionCode: '',             // 自定义条件代码
            
            // 比较参数
            operator: 'equals',            // 比较操作符：equals, not_equals, greater, less, greater_equal, less_equal
            expectedValue: true,           // 期望值
            tolerance: 0,                  // 数值比较的容差
            
            // 距离条件参数
            targetId: '',                  // 目标对象ID
            distance: 100,                 // 距离阈值
            
            // 健康条件参数
            healthThreshold: 50,           // 健康值阈值
            healthType: 'absolute',        // 健康类型：absolute, percentage
            
            // 变量条件参数
            variableName: '',              // 变量名
            variableScope: 'context',      // 变量作用域：context, global, agent
            
            // 属性条件参数
            objectId: '',                  // 对象ID
            propertyPath: '',              // 属性路径（如 'position.x'）
            
            // 通用属性
            description: '条件节点：检查某个条件是否满足',
            tooltip: '条件节点会检查指定的条件，返回成功或失败'
        };
    }

    /**
     * 执行条件检查逻辑
     */
    execute(context = {}) {
        super.execute(context);
        
        try {
            const result = this.checkCondition(context);
            
            // 记录执行信息
            this.logExecution(`条件检查结果: ${result}`, context);
            
            this.status = result ? NodeStatus.SUCCESS : NodeStatus.FAILURE;
            return this.status;
        } catch (error) {
            this.logExecution(`条件检查错误: ${error.message}`, context);
            this.status = NodeStatus.ERROR;
            return this.status;
        }
    }

    /**
     * 检查具体条件
     */
    checkCondition(context) {
        switch (this.properties.conditionType) {
            case 'distance':
                return this.checkDistance(context);
            
            case 'health':
                return this.checkHealth(context);
            
            case 'variable':
                return this.checkVariable(context);
            
            case 'property':
                return this.checkProperty(context);
            
            case 'custom':
                return this.checkCustom(context);
            
            default:
                return false;
        }
    }

    /**
     * 检查距离条件
     */
    checkDistance(context) {
        const agent = context.agent;
        const world = context.world;
        
        if (!agent || !world) {
            return false;
        }

        const target = world.getEntity(this.properties.targetId) || world.getObject(this.properties.targetId);
        if (!target) {
            this.logExecution(`距离检查目标不存在: ${this.properties.targetId}`, context);
            return false;
        }

        const distance = this.calculateDistance(agent.position, target.position);
        return this.compareValues(distance, this.properties.distance);
    }

    /**
     * 检查健康条件
     */
    checkHealth(context) {
        const agent = context.agent;
        if (!agent) {
            return false;
        }

        let healthValue;
        if (this.properties.healthType === 'percentage') {
            healthValue = (agent.health / agent.maxHealth) * 100;
        } else {
            healthValue = agent.health;
        }

        return this.compareValues(healthValue, this.properties.healthThreshold);
    }

    /**
     * 检查变量条件
     */
    checkVariable(context) {
        const variableName = this.properties.variableName;
        if (!variableName) {
            return false;
        }

        let value;
        switch (this.properties.variableScope) {
            case 'context':
                value = context[variableName];
                break;
            
            case 'global':
                value = window[variableName];
                break;
            
            case 'agent':
                value = context.agent?.[variableName];
                break;
            
            default:
                return false;
        }

        return this.compareValues(value, this.properties.expectedValue);
    }

    /**
     * 检查属性条件
     */
    checkProperty(context) {
        const world = context.world;
        if (!world) {
            return false;
        }

        const object = world.getEntity(this.properties.objectId) || world.getObject(this.properties.objectId);
        if (!object) {
            this.logExecution(`属性检查对象不存在: ${this.properties.objectId}`, context);
            return false;
        }

        const value = this.getNestedProperty(object, this.properties.propertyPath);
        return this.compareValues(value, this.properties.expectedValue);
    }

    /**
     * 检查自定义条件
     */
    checkCustom(context) {
        if (!this.properties.conditionCode) {
            return false;
        }

        try {
            // 创建安全的执行环境
            const conditionFunction = new Function('context', 'node', 'NodeStatus', this.properties.conditionCode);
            const result = conditionFunction(context, this, NodeStatus);
            
            return Boolean(result);
        } catch (error) {
            this.logExecution(`自定义条件执行错误: ${error.message}`, context);
            return false;
        }
    }

    /**
     * 比较两个值
     */
    compareValues(actual, expected) {
        switch (this.properties.operator) {
            case 'equals':
                return this.isEqual(actual, expected);
            
            case 'not_equals':
                return !this.isEqual(actual, expected);
            
            case 'greater':
                return Number(actual) > Number(expected);
            
            case 'less':
                return Number(actual) < Number(expected);
            
            case 'greater_equal':
                return Number(actual) >= Number(expected);
            
            case 'less_equal':
                return Number(actual) <= Number(expected);
            
            default:
                return false;
        }
    }

    /**
     * 检查两个值是否相等（考虑容差）
     */
    isEqual(actual, expected) {
        if (typeof actual === 'number' && typeof expected === 'number') {
            return Math.abs(actual - expected) <= this.properties.tolerance;
        }
        
        return actual === expected;
    }

    /**
     * 获取嵌套属性值
     */
    getNestedProperty(obj, path) {
        if (!path) return obj;
        
        return path.split('.').reduce((current, key) => {
            return current && current[key] !== undefined ? current[key] : undefined;
        }, obj);
    }

    /**
     * 计算两点距离
     */
    calculateDistance(pos1, pos2) {
        const dx = pos2.x - pos1.x;
        const dy = pos2.y - pos1.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * 检查是否可以有子节点
     */
    canHaveChildren() {
        return false; // 叶子节点不能有子节点
    }

    /**
     * 记录执行日志
     */
    logExecution(message, context) {
        if (context.logger) {
            context.logger.log('condition', message, this.id);
        }
    }

    /**
     * 获取属性配置界面
     */
    getPropertyConfig() {
        return {
            title: '条件节点配置',
            properties: [
                {
                    key: 'conditionType',
                    label: '条件类型',
                    type: 'select',
                    value: this.properties.conditionType,
                    options: [
                        { value: 'custom', label: '自定义条件' },
                        { value: 'distance', label: '距离条件' },
                        { value: 'health', label: '健康条件' },
                        { value: 'variable', label: '变量条件' },
                        { value: 'property', label: '属性条件' }
                    ],
                    description: '要检查的条件类型'
                },
                {
                    key: 'conditionCode',
                    label: '条件代码',
                    type: 'code',
                    value: this.properties.conditionCode,
                    description: '自定义条件的JavaScript代码，返回true或false',
                    visible: () => this.properties.conditionType === 'custom'
                },
                {
                    key: 'operator',
                    label: '比较操作符',
                    type: 'select',
                    value: this.properties.operator,
                    options: [
                        { value: 'equals', label: '等于' },
                        { value: 'not_equals', label: '不等于' },
                        { value: 'greater', label: '大于' },
                        { value: 'less', label: '小于' },
                        { value: 'greater_equal', label: '大于等于' },
                        { value: 'less_equal', label: '小于等于' }
                    ],
                    description: '值比较的操作符',
                    visible: () => this.properties.conditionType !== 'custom'
                },
                {
                    key: 'tolerance',
                    label: '数值容差',
                    type: 'number',
                    value: this.properties.tolerance,
                    min: 0,
                    description: '数值比较时的容差范围',
                    visible: () => this.properties.operator === 'equals' || this.properties.operator === 'not_equals'
                },
                
                // 距离条件参数
                {
                    key: 'targetId',
                    label: '目标对象ID',
                    type: 'text',
                    value: this.properties.targetId,
                    description: '要检查距离的目标对象ID',
                    visible: () => this.properties.conditionType === 'distance'
                },
                {
                    key: 'distance',
                    label: '距离阈值',
                    type: 'number',
                    value: this.properties.distance,
                    min: 0,
                    description: '距离比较的阈值',
                    visible: () => this.properties.conditionType === 'distance'
                },
                
                // 健康条件参数
                {
                    key: 'healthType',
                    label: '健康类型',
                    type: 'select',
                    value: this.properties.healthType,
                    options: [
                        { value: 'absolute', label: '绝对值' },
                        { value: 'percentage', label: '百分比' }
                    ],
                    description: '健康值的类型',
                    visible: () => this.properties.conditionType === 'health'
                },
                {
                    key: 'healthThreshold',
                    label: '健康阈值',
                    type: 'number',
                    value: this.properties.healthThreshold,
                    min: 0,
                    description: '健康值比较的阈值',
                    visible: () => this.properties.conditionType === 'health'
                },
                
                // 变量条件参数
                {
                    key: 'variableScope',
                    label: '变量作用域',
                    type: 'select',
                    value: this.properties.variableScope,
                    options: [
                        { value: 'context', label: '上下文' },
                        { value: 'global', label: '全局' },
                        { value: 'agent', label: '代理' }
                    ],
                    description: '变量的作用域',
                    visible: () => this.properties.conditionType === 'variable'
                },
                {
                    key: 'variableName',
                    label: '变量名',
                    type: 'text',
                    value: this.properties.variableName,
                    description: '要检查的变量名',
                    visible: () => this.properties.conditionType === 'variable'
                },
                
                // 属性条件参数
                {
                    key: 'objectId',
                    label: '对象ID',
                    type: 'text',
                    value: this.properties.objectId,
                    description: '要检查属性的对象ID',
                    visible: () => this.properties.conditionType === 'property'
                },
                {
                    key: 'propertyPath',
                    label: '属性路径',
                    type: 'text',
                    value: this.properties.propertyPath,
                    description: '属性的路径，如 "position.x" 或 "status"',
                    visible: () => this.properties.conditionType === 'property'
                },
                
                {
                    key: 'expectedValue',
                    label: '期望值',
                    type: 'text',
                    value: this.properties.expectedValue,
                    description: '条件比较的期望值',
                    visible: () => ['variable', 'property'].includes(this.properties.conditionType)
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
        
        if (this.properties.conditionType === 'custom' && !this.properties.conditionCode) {
            errors.push('自定义条件必须提供条件代码');
        }
        
        if (this.properties.conditionType === 'distance' && !this.properties.targetId) {
            errors.push('距离条件必须指定目标ID');
        }
        
        if (this.properties.conditionType === 'variable' && !this.properties.variableName) {
            errors.push('变量条件必须指定变量名');
        }
        
        if (this.properties.conditionType === 'property') {
            if (!this.properties.objectId) {
                errors.push('属性条件必须指定对象ID');
            }
            if (!this.properties.propertyPath) {
                errors.push('属性条件必须指定属性路径');
            }
        }

        if (this.properties.tolerance < 0) {
            errors.push('容差不能为负数');
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
            type: 'Condition',
            conditionType: this.properties.conditionType,
            operator: this.properties.operator,
            expectedValue: this.properties.expectedValue,
            properties: this.properties
        };
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ConditionNode;
} else if (typeof window !== 'undefined') {
    window.ConditionNode = ConditionNode;
} 