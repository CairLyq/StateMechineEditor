/**
 * 动作节点 - Action Node
 * 执行具体的动作或行为
 */
class ActionNode extends BaseNode {
    constructor(name = '', id = null) {
        super(NodeType.ACTION, name, id);
        this.actionStartTime = 0;
    }

    /**
     * 获取默认属性
     */
    getDefaultProperties() {
        return {
            // 动作特有属性
            actionType: 'custom',      // 动作类型：custom, move, attack, interact, wait
            actionCode: '',            // 自定义动作代码
            
            // 执行参数
            duration: 1000,            // 执行持续时间（毫秒）
            async: false,              // 是否异步执行
            retryCount: 0,             // 失败重试次数
            retryDelay: 500,           // 重试延迟（毫秒）
            
            // 移动动作参数
            targetPosition: { x: 0, y: 0 },  // 目标位置
            moveSpeed: 100,            // 移动速度
            
            // 攻击动作参数
            targetId: '',              // 攻击目标ID
            damage: 10,                // 伤害值
            range: 50,                 // 攻击范围
            
            // 交互动作参数
            objectId: '',              // 交互对象ID
            interactionType: 'use',    // 交互类型
            
            // 通用属性
            description: '动作节点：执行具体的动作或行为',
            tooltip: '动作节点会执行指定的动作，如移动、攻击、交互等'
        };
    }

    /**
     * 初始化节点
     */
    initializeNode() {
        this.actionStartTime = 0;
        this.currentRetry = 0;
        this.lastError = null;
    }

    /**
     * 执行动作逻辑
     */
    execute(context = {}) {
        super.execute(context);
        
        // 开始执行动作
        if (this.actionStartTime === 0) {
            this.actionStartTime = Date.now();
            this.logExecution(`开始执行动作: ${this.properties.actionType}`, context);
        }

        try {
            const result = this.executeAction(context);
            
            if (result === NodeStatus.FAILURE && this.shouldRetry()) {
                return this.handleRetry(context);
            }
            
            this.status = result;
            return this.status;
        } catch (error) {
            this.lastError = error;
            this.logExecution(`动作执行错误: ${error.message}`, context);
            
            if (this.shouldRetry()) {
                return this.handleRetry(context);
            }
            
            this.status = NodeStatus.ERROR;
            return this.status;
        }
    }

    /**
     * 执行具体动作
     */
    executeAction(context) {
        switch (this.properties.actionType) {
            case 'move':
                return this.executeMove(context);
            
            case 'attack':
                return this.executeAttack(context);
            
            case 'interact':
                return this.executeInteract(context);
            
            case 'wait':
                return this.executeWait(context);
            
            case 'custom':
                return this.executeCustom(context);
            
            default:
                return NodeStatus.FAILURE;
        }
    }

    /**
     * 执行移动动作
     */
    executeMove(context) {
        const agent = context.agent;
        if (!agent) {
            return NodeStatus.FAILURE;
        }

        const target = this.properties.targetPosition;
        const distance = this.calculateDistance(agent.position, target);
        
        if (distance <= 5) { // 到达目标
            this.logExecution(`已到达目标位置 (${target.x}, ${target.y})`, context);
            return NodeStatus.SUCCESS;
        }

        // 模拟移动
        const elapsed = Date.now() - this.actionStartTime;
        const moveDistance = (this.properties.moveSpeed * elapsed) / 1000;
        
        if (moveDistance >= distance) {
            agent.position = { ...target };
            return NodeStatus.SUCCESS;
        } else {
            // 继续移动
            const progress = moveDistance / distance;
            agent.position = {
                x: agent.position.x + (target.x - agent.position.x) * progress,
                y: agent.position.y + (target.y - agent.position.y) * progress
            };
            return NodeStatus.RUNNING;
        }
    }

    /**
     * 执行攻击动作
     */
    executeAttack(context) {
        const agent = context.agent;
        const world = context.world;
        
        if (!agent || !world) {
            return NodeStatus.FAILURE;
        }

        const target = world.getEntity(this.properties.targetId);
        if (!target) {
            this.logExecution(`攻击目标不存在: ${this.properties.targetId}`, context);
            return NodeStatus.FAILURE;
        }

        const distance = this.calculateDistance(agent.position, target.position);
        if (distance > this.properties.range) {
            this.logExecution(`目标超出攻击范围: ${distance} > ${this.properties.range}`, context);
            return NodeStatus.FAILURE;
        }

        // 执行攻击
        target.takeDamage(this.properties.damage);
        this.logExecution(`攻击 ${target.name}，造成 ${this.properties.damage} 伤害`, context);
        
        return NodeStatus.SUCCESS;
    }

    /**
     * 执行交互动作
     */
    executeInteract(context) {
        const agent = context.agent;
        const world = context.world;
        
        if (!agent || !world) {
            return NodeStatus.FAILURE;
        }

        const object = world.getObject(this.properties.objectId);
        if (!object) {
            this.logExecution(`交互对象不存在: ${this.properties.objectId}`, context);
            return NodeStatus.FAILURE;
        }

        // 执行交互
        const result = object.interact(agent, this.properties.interactionType);
        this.logExecution(`与 ${object.name} 进行 ${this.properties.interactionType} 交互`, context);
        
        return result ? NodeStatus.SUCCESS : NodeStatus.FAILURE;
    }

    /**
     * 执行等待动作
     */
    executeWait(context) {
        const elapsed = Date.now() - this.actionStartTime;
        
        if (elapsed >= this.properties.duration) {
            this.logExecution(`等待完成: ${this.properties.duration}ms`, context);
            return NodeStatus.SUCCESS;
        } else {
            return NodeStatus.RUNNING;
        }
    }

    /**
     * 执行自定义动作
     */
    executeCustom(context) {
        if (!this.properties.actionCode) {
            return NodeStatus.FAILURE;
        }

        try {
            // 创建安全的执行环境
            const actionFunction = new Function('context', 'node', 'NodeStatus', this.properties.actionCode);
            const result = actionFunction(context, this, NodeStatus);
            
            return result || NodeStatus.SUCCESS;
        } catch (error) {
            this.logExecution(`自定义动作执行错误: ${error.message}`, context);
            return NodeStatus.ERROR;
        }
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
     * 检查是否应该重试
     */
    shouldRetry() {
        return this.currentRetry < this.properties.retryCount;
    }

    /**
     * 处理重试
     */
    handleRetry(context) {
        this.currentRetry++;
        this.logExecution(`第 ${this.currentRetry} 次重试`, context);
        
        // 重置动作开始时间
        this.actionStartTime = Date.now() + this.properties.retryDelay;
        
        return NodeStatus.RUNNING;
    }

    /**
     * 重置节点状态
     */
    reset() {
        super.reset();
        this.actionStartTime = 0;
        this.currentRetry = 0;
        this.lastError = null;
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
            context.logger.log('action', message, this.id);
        }
    }

    /**
     * 获取属性配置界面
     */
    getPropertyConfig() {
        return {
            title: '动作节点配置',
            properties: [
                {
                    key: 'actionType',
                    label: '动作类型',
                    type: 'select',
                    value: this.properties.actionType,
                    options: [
                        { value: 'custom', label: '自定义动作' },
                        { value: 'move', label: '移动' },
                        { value: 'attack', label: '攻击' },
                        { value: 'interact', label: '交互' },
                        { value: 'wait', label: '等待' }
                    ],
                    description: '要执行的动作类型'
                },
                {
                    key: 'actionCode',
                    label: '动作代码',
                    type: 'code',
                    value: this.properties.actionCode,
                    description: '自定义动作的JavaScript代码',
                    visible: () => this.properties.actionType === 'custom'
                },
                {
                    key: 'duration',
                    label: '持续时间（毫秒）',
                    type: 'number',
                    value: this.properties.duration,
                    min: 0,
                    description: '动作执行的持续时间'
                },
                {
                    key: 'retryCount',
                    label: '重试次数',
                    type: 'number',
                    value: this.properties.retryCount,
                    min: 0,
                    description: '失败时的重试次数'
                },
                {
                    key: 'retryDelay',
                    label: '重试延迟（毫秒）',
                    type: 'number',
                    value: this.properties.retryDelay,
                    min: 0,
                    description: '重试之间的延迟时间',
                    visible: () => this.properties.retryCount > 0
                },
                
                // 移动动作参数
                {
                    key: 'targetPosition',
                    label: '目标位置',
                    type: 'object',
                    value: this.properties.targetPosition,
                    description: '移动的目标位置 {x, y}',
                    visible: () => this.properties.actionType === 'move'
                },
                {
                    key: 'moveSpeed',
                    label: '移动速度',
                    type: 'number',
                    value: this.properties.moveSpeed,
                    min: 1,
                    description: '移动速度（像素/秒）',
                    visible: () => this.properties.actionType === 'move'
                },
                
                // 攻击动作参数
                {
                    key: 'targetId',
                    label: '攻击目标ID',
                    type: 'text',
                    value: this.properties.targetId,
                    description: '要攻击的目标实体ID',
                    visible: () => this.properties.actionType === 'attack'
                },
                {
                    key: 'damage',
                    label: '伤害值',
                    type: 'number',
                    value: this.properties.damage,
                    min: 0,
                    description: '攻击造成的伤害',
                    visible: () => this.properties.actionType === 'attack'
                },
                {
                    key: 'range',
                    label: '攻击范围',
                    type: 'number',
                    value: this.properties.range,
                    min: 0,
                    description: '攻击的有效范围',
                    visible: () => this.properties.actionType === 'attack'
                },
                
                // 交互动作参数
                {
                    key: 'objectId',
                    label: '交互对象ID',
                    type: 'text',
                    value: this.properties.objectId,
                    description: '要交互的对象ID',
                    visible: () => this.properties.actionType === 'interact'
                },
                {
                    key: 'interactionType',
                    label: '交互类型',
                    type: 'select',
                    value: this.properties.interactionType,
                    options: [
                        { value: 'use', label: '使用' },
                        { value: 'pickup', label: '拾取' },
                        { value: 'open', label: '打开' },
                        { value: 'close', label: '关闭' }
                    ],
                    description: '交互的类型',
                    visible: () => this.properties.actionType === 'interact'
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
        
        if (this.properties.actionType === 'custom' && !this.properties.actionCode) {
            errors.push('自定义动作必须提供动作代码');
        }
        
        if (this.properties.actionType === 'move') {
            if (!this.properties.targetPosition || 
                typeof this.properties.targetPosition.x !== 'number' ||
                typeof this.properties.targetPosition.y !== 'number') {
                errors.push('移动动作必须提供有效的目标位置');
            }
        }
        
        if (this.properties.actionType === 'attack' && !this.properties.targetId) {
            errors.push('攻击动作必须指定目标ID');
        }
        
        if (this.properties.actionType === 'interact' && !this.properties.objectId) {
            errors.push('交互动作必须指定对象ID');
        }

        if (this.properties.duration < 0) {
            errors.push('持续时间不能为负数');
        }

        if (this.properties.retryCount < 0) {
            errors.push('重试次数不能为负数');
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
            type: 'Action',
            actionType: this.properties.actionType,
            actionStartTime: this.actionStartTime,
            currentRetry: this.currentRetry,
            lastError: this.lastError?.message || null,
            properties: this.properties
        };
    }

    /**
     * 获取执行进度
     */
    getProgress() {
        if (this.properties.actionType === 'wait' && this.actionStartTime > 0) {
            const elapsed = Date.now() - this.actionStartTime;
            return Math.min(elapsed / this.properties.duration, 1);
        }
        
        return this.status === NodeStatus.SUCCESS ? 1 : 0;
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ActionNode;
} else if (typeof window !== 'undefined') {
    window.ActionNode = ActionNode;
} 