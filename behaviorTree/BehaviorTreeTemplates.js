/**
 * 行为树模板库 - 常用节点组合模板
 * Behavior Tree Templates - Common Node Combination Templates
 */

class BehaviorTreeTemplates {
    constructor() {
        this.templates = new Map();
        this.categories = new Set();
        this.initializeDefaultTemplates();
    }

    /**
     * 初始化默认模板
     */
    initializeDefaultTemplates() {
        // 基础AI行为模板
        this.addTemplate('basic_ai', {
            name: '基础AI行为 Basic AI Behavior',
            description: '包含战斗和巡逻的基础AI行为树',
            category: 'AI',
            icon: 'fas fa-robot',
            nodes: [
                {
                    type: NodeType.ROOT,
                    name: '根节点 Root',
                    x: 0,
                    y: 0,
                    children: [
                        {
                            type: NodeType.SELECTOR,
                            name: '主选择器 Main Selector',
                            x: 0,
                            y: 100,
                            children: [
                                {
                                    type: NodeType.SEQUENCE,
                                    name: '战斗序列 Combat Sequence',
                                    x: -200,
                                    y: 200,
                                    children: [
                                        {
                                            type: NodeType.CONDITION,
                                            name: '发现敌人 Enemy Detected',
                                            x: -300,
                                            y: 200,
                                            properties: {
                                                conditionType: 'enemyInRange',
                                                range: 10
                                            }
                                        },
                                        {
                                            type: NodeType.ACTION,
                                            name: '攻击敌人 Attack Enemy',
                                            x: -100,
                                            y: 200,
                                            properties: {
                                                actionType: 'attack',
                                                damage: 10
                                            }
                                        }
                                    ]
                                },
                                {
                                    type: NodeType.SEQUENCE,
                                    name: '巡逻序列 Patrol Sequence',
                                    x: 200,
                                    y: 100,
                                    children: [
                                        {
                                            type: NodeType.CONDITION,
                                            name: '到达巡逻点 Reached Patrol Point',
                                            x: 100,
                                            y: 200,
                                            properties: {
                                                conditionType: 'atDestination',
                                                tolerance: 1
                                            }
                                        },
                                        {
                                            type: NodeType.ACTION,
                                            name: '移动到下一点 Move to Next Point',
                                            x: 300,
                                            y: 200,
                                            properties: {
                                                actionType: 'moveTo',
                                                target: 'nextPatrolPoint'
                                            }
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ]
        });

        // 对话系统模板
        this.addTemplate('dialogue_system', {
            name: '对话系统 Dialogue System',
            description: 'NPC对话处理系统，包含问候、对话选择、任务分配等',
            category: 'NPC',
            icon: 'fas fa-comments',
            nodes: [
                {
                    type: NodeType.ROOT,
                    name: '根节点 Root',
                    x: 0,
                    y: 0,
                    children: [
                        {
                            type: NodeType.SEQUENCE,
                            name: '对话流程 Dialogue Flow',
                            x: 0,
                            y: 100,
                            children: [
                                {
                                    type: NodeType.CONDITION,
                                    name: '玩家接近 Player Nearby',
                                    x: -100,
                                    y: 200,
                                    properties: {
                                        conditionType: 'distance',
                                        targetType: 'player',
                                        operator: 'less_than',
                                        value: 5,
                                        tolerance: 0.5
                                    }
                                },
                                {
                                    type: NodeType.ACTION,
                                    name: '显示问候 Show Greeting',
                                    x: 0,
                                    y: 200,
                                    properties: {
                                        actionType: 'custom',
                                        customCode: 'console.log("Hello, traveler!"); return "success";'
                                    }
                                },
                                {
                                    type: NodeType.SELECTOR,
                                    name: '对话选择 Dialogue Options',
                                    x: 100,
                                    y: 200,
                                    children: [
                                        {
                                            type: NodeType.SEQUENCE,
                                            name: '任务分支 Quest Branch',
                                            x: 50,
                                            y: 300,
                                            children: [
                                                {
                                                    type: NodeType.CONDITION,
                                                    name: '选择任务 Quest Selected',
                                                    x: 0,
                                                    y: 400,
                                                    properties: {
                                                        conditionType: 'variable',
                                                        variableType: 'context',
                                                        variableName: 'questSelected',
                                                        operator: 'equals',
                                                        value: true
                                                    }
                                                },
                                                {
                                                    type: NodeType.ACTION,
                                                    name: '分配任务 Assign Quest',
                                                    x: 100,
                                                    y: 400,
                                                    properties: {
                                                        actionType: 'custom',
                                                        customCode: 'context.quest = "newQuest"; return "success";'
                                                    }
                                                }
                                            ]
                                        },
                                        {
                                            type: NodeType.ACTION,
                                            name: '告别 Say Goodbye',
                                            x: 150,
                                            y: 300,
                                            properties: {
                                                actionType: 'custom',
                                                customCode: 'console.log("Goodbye!"); return "success";'
                                            }
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ]
        });

        // 收集资源模板
        this.addTemplate('resource_gathering', {
            name: '资源收集 Resource Gathering',
            description: '自动资源收集AI，包含寻找、移动、收集、存储等行为',
            category: 'Automation',
            icon: 'fas fa-hammer',
            nodes: [
                {
                    type: NodeType.ROOT,
                    name: '根节点 Root',
                    x: 0,
                    y: 0,
                    children: [
                        {
                            type: NodeType.REPEATER,
                            name: '收集循环 Gathering Loop',
                            x: 0,
                            y: 100,
                            properties: {
                                repeatType: 'forever',
                                resetChildOnRepeat: true
                            },
                            children: [
                                {
                                    type: NodeType.SEQUENCE,
                                    name: '收集序列 Gathering Sequence',
                                    x: 0,
                                    y: 200,
                                    children: [
                                        {
                                            type: NodeType.CONDITION,
                                            name: '背包未满 Inventory Not Full',
                                            x: -150,
                                            y: 300,
                                            properties: {
                                                conditionType: 'custom',
                                                customCode: 'return context.inventoryCount < context.maxInventory;'
                                            }
                                        },
                                        {
                                            type: NodeType.ACTION,
                                            name: '寻找资源 Find Resource',
                                            x: -50,
                                            y: 300,
                                            properties: {
                                                actionType: 'custom',
                                                customCode: 'context.nearestResource = findNearestResource(); return "success";'
                                            }
                                        },
                                        {
                                            type: NodeType.ACTION,
                                            name: '移动到资源 Move to Resource',
                                            x: 50,
                                            y: 300,
                                            properties: {
                                                actionType: 'move',
                                                targetType: 'resource',
                                                speed: 2,
                                                stopDistance: 1
                                            }
                                        },
                                        {
                                            type: NodeType.ACTION,
                                            name: '收集资源 Collect Resource',
                                            x: 150,
                                            y: 300,
                                            properties: {
                                                actionType: 'interact',
                                                interactionType: 'collect',
                                                duration: 2000
                                            }
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ]
        });

        // 状态机转换模板
        this.addTemplate('state_machine', {
            name: '状态机 State Machine',
            description: '基础状态机模式，用于角色状态管理',
            category: 'State Management',
            icon: 'fas fa-sitemap',
            nodes: [
                {
                    type: NodeType.SELECTOR,
                    name: '状态选择器 State Selector',
                    x: 0,
                    y: 0,
                    children: [
                        {
                            type: NodeType.SEQUENCE,
                            name: '空闲状态 Idle State',
                            x: -200,
                            y: 100,
                            children: [
                                {
                                    type: NodeType.CONDITION,
                                    name: '无任务 No Task',
                                    x: -200,
                                    y: 200
                                },
                                {
                                    type: NodeType.ACTION,
                                    name: '播放空闲动画 Play Idle Animation',
                                    x: -200,
                                    y: 300
                                }
                            ]
                        },
                        {
                            type: NodeType.SEQUENCE,
                            name: '移动状态 Moving State',
                            x: 0,
                            y: 100,
                            children: [
                                {
                                    type: NodeType.CONDITION,
                                    name: '有移动目标 Has Move Target',
                                    x: 0,
                                    y: 200
                                },
                                {
                                    type: NodeType.ACTION,
                                    name: '执行移动 Execute Movement',
                                    x: 0,
                                    y: 300
                                }
                            ]
                        },
                        {
                            type: NodeType.SEQUENCE,
                            name: '工作状态 Working State',
                            x: 200,
                            y: 100,
                            children: [
                                {
                                    type: NodeType.CONDITION,
                                    name: '有工作任务 Has Work Task',
                                    x: 200,
                                    y: 200
                                },
                                {
                                    type: NodeType.ACTION,
                                    name: '执行工作 Execute Work',
                                    x: 200,
                                    y: 300
                                }
                            ]
                        }
                    ]
                }
            ]
        });

        // 错误处理模板
        this.addTemplate('error_handling', {
            name: '错误处理 Error Handling',
            description: '包含重试机制的错误处理行为树',
            category: 'Utility',
            icon: 'fas fa-exclamation-triangle',
            nodes: [
                {
                    type: NodeType.ROOT,
                    name: '根节点 Root',
                    x: 0,
                    y: 0,
                    children: [
                        {
                            type: NodeType.REPEATER,
                            name: '重试器 Retry Handler',
                            x: 0,
                            y: 100,
                            properties: {
                                repeatType: 'until_success',
                                maxRepeats: 3,
                                resetChildOnRepeat: true
                            },
                            children: [
                                {
                                    type: NodeType.SEQUENCE,
                                    name: '尝试执行 Try Execute',
                                    x: 0,
                                    y: 200,
                                    children: [
                                        {
                                            type: NodeType.ACTION,
                                            name: '执行任务 Execute Task',
                                            x: -50,
                                            y: 300,
                                            properties: {
                                                actionType: 'custom',
                                                customCode: 'return Math.random() > 0.5 ? "success" : "failure";'
                                            }
                                        },
                                        {
                                            type: NodeType.CONDITION,
                                            name: '检查结果 Check Result',
                                            x: 50,
                                            y: 300,
                                            properties: {
                                                conditionType: 'custom',
                                                customCode: 'return context.lastResult === "success";'
                                            }
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ]
        });

        // 巡逻AI模板
        this.addTemplate('patrol_ai', {
            name: '巡逻AI Patrol AI',
            description: '智能巡逻系统，包含路径规划和敌人检测',
            category: 'AI',
            icon: 'fas fa-route',
            nodes: [
                {
                    type: NodeType.ROOT,
                    name: '根节点 Root',
                    x: 0,
                    y: 0,
                    children: [
                        {
                            type: NodeType.SELECTOR,
                            name: '主选择器 Main Selector',
                            x: 0,
                            y: 100,
                            children: [
                                {
                                    type: NodeType.SEQUENCE,
                                    name: '敌人检测序列 Enemy Detection',
                                    x: -200,
                                    y: 200,
                                    children: [
                                        {
                                            type: NodeType.CONDITION,
                                            name: '检测敌人 Detect Enemy',
                                            x: -200,
                                            y: 300,
                                            properties: {
                                                conditionType: 'distance',
                                                targetType: 'enemy',
                                                operator: 'less_than',
                                                value: 10,
                                                tolerance: 0.5
                                            }
                                        },
                                        {
                                            type: NodeType.ACTION,
                                            name: '追击敌人 Chase Enemy',
                                            x: -200,
                                            y: 400,
                                            properties: {
                                                actionType: 'move',
                                                targetType: 'enemy',
                                                speed: 5,
                                                stopDistance: 2
                                            }
                                        }
                                    ]
                                },
                                {
                                    type: NodeType.REPEATER,
                                    name: '巡逻循环 Patrol Loop',
                                    x: 200,
                                    y: 200,
                                    properties: {
                                        repeatType: 'forever',
                                        resetChildOnRepeat: false
                                    },
                                    children: [
                                        {
                                            type: NodeType.SEQUENCE,
                                            name: '巡逻序列 Patrol Sequence',
                                            x: 200,
                                            y: 300,
                                            children: [
                                                {
                                                    type: NodeType.ACTION,
                                                    name: '移动到巡逻点 Move to Patrol Point',
                                                    x: 100,
                                                    y: 400,
                                                    properties: {
                                                        actionType: 'move',
                                                        targetType: 'patrol_point',
                                                        speed: 2,
                                                        stopDistance: 1
                                                    }
                                                },
                                                {
                                                    type: NodeType.ACTION,
                                                    name: '等待 Wait',
                                                    x: 300,
                                                    y: 400,
                                                    properties: {
                                                        actionType: 'wait',
                                                        duration: 2000
                                                    }
                                                }
                                            ]
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ]
        });

        // 决策树模板
        this.addTemplate('decision_tree', {
            name: '决策树 Decision Tree',
            description: '基于条件的复杂决策系统',
            category: 'AI',
            icon: 'fas fa-sitemap',
            nodes: [
                {
                    type: NodeType.ROOT,
                    name: '根节点 Root',
                    x: 0,
                    y: 0,
                    children: [
                        {
                            type: NodeType.SELECTOR,
                            name: '决策选择器 Decision Selector',
                            x: 0,
                            y: 100,
                            children: [
                                {
                                    type: NodeType.SEQUENCE,
                                    name: '紧急情况 Emergency',
                                    x: -300,
                                    y: 200,
                                    children: [
                                        {
                                            type: NodeType.CONDITION,
                                            name: '健康值低 Low Health',
                                            x: -300,
                                            y: 300,
                                            properties: {
                                                conditionType: 'health',
                                                healthType: 'percentage',
                                                operator: 'less_than',
                                                value: 30
                                            }
                                        },
                                        {
                                            type: NodeType.ACTION,
                                            name: '寻找治疗 Find Healing',
                                            x: -300,
                                            y: 400,
                                            properties: {
                                                actionType: 'move',
                                                targetType: 'healing_item',
                                                speed: 3
                                            }
                                        }
                                    ]
                                },
                                {
                                    type: NodeType.SEQUENCE,
                                    name: '战斗模式 Combat Mode',
                                    x: -100,
                                    y: 200,
                                    children: [
                                        {
                                            type: NodeType.CONDITION,
                                            name: '有敌人 Has Enemy',
                                            x: -100,
                                            y: 300,
                                            properties: {
                                                conditionType: 'distance',
                                                targetType: 'enemy',
                                                operator: 'less_than',
                                                value: 15
                                            }
                                        },
                                        {
                                            type: NodeType.PARALLEL,
                                            name: '战斗行为 Combat Behavior',
                                            x: -100,
                                            y: 400,
                                            properties: {
                                                strategy: 'require_all',
                                                allowPartialSuccess: false
                                            },
                                            children: [
                                                {
                                                    type: NodeType.ACTION,
                                                    name: '攻击 Attack',
                                                    x: -150,
                                                    y: 500,
                                                    properties: {
                                                        actionType: 'attack',
                                                        targetType: 'nearest_enemy',
                                                        damage: 10,
                                                        range: 5
                                                    }
                                                },
                                                {
                                                    type: NodeType.ACTION,
                                                    name: '保持距离 Keep Distance',
                                                    x: -50,
                                                    y: 500,
                                                    properties: {
                                                        actionType: 'move',
                                                        targetType: 'away_from_enemy',
                                                        speed: 2,
                                                        minDistance: 3
                                                    }
                                                }
                                            ]
                                        }
                                    ]
                                },
                                {
                                    type: NodeType.SEQUENCE,
                                    name: '探索模式 Exploration Mode',
                                    x: 100,
                                    y: 200,
                                    children: [
                                        {
                                            type: NodeType.CONDITION,
                                            name: '无任务 No Task',
                                            x: 100,
                                            y: 300,
                                            properties: {
                                                conditionType: 'variable',
                                                variableType: 'context',
                                                variableName: 'currentTask',
                                                operator: 'equals',
                                                value: null
                                            }
                                        },
                                        {
                                            type: NodeType.ACTION,
                                            name: '随机移动 Random Move',
                                            x: 100,
                                            y: 400,
                                            properties: {
                                                actionType: 'move',
                                                targetType: 'random_position',
                                                speed: 1,
                                                radius: 20
                                            }
                                        }
                                    ]
                                },
                                {
                                    type: NodeType.ACTION,
                                    name: '空闲 Idle',
                                    x: 300,
                                    y: 200,
                                    properties: {
                                        actionType: 'wait',
                                        duration: 1000
                                    }
                                }
                            ]
                        }
                    ]
                }
            ]
        });
    }

    /**
     * 添加模板
     */
    addTemplate(id, template) {
        template.id = id;
        template.created = new Date();
        this.templates.set(id, template);
    }

    /**
     * 获取模板
     */
    getTemplate(id) {
        return this.templates.get(id);
    }

    /**
     * 获取所有模板
     */
    getAllTemplates() {
        return Array.from(this.templates.values());
    }

    /**
     * 按分类获取模板
     */
    getTemplatesByCategory(category) {
        return this.getAllTemplates().filter(template => template.category === category);
    }

    /**
     * 搜索模板
     */
    searchTemplates(query) {
        const lowerQuery = query.toLowerCase();
        return this.getAllTemplates().filter(template => 
            template.name.toLowerCase().includes(lowerQuery) ||
            template.description.toLowerCase().includes(lowerQuery) ||
            template.category.toLowerCase().includes(lowerQuery)
        );
    }

    /**
     * 删除模板
     */
    removeTemplate(id) {
        return this.templates.delete(id);
    }

    /**
     * 从节点创建模板
     */
    createTemplateFromNodes(nodes, metadata) {
        const template = {
            ...metadata,
            nodes: this.serializeNodes(nodes),
            created: new Date()
        };
        
        if (metadata.id) {
            this.addTemplate(metadata.id, template);
        }
        
        return template;
    }

    /**
     * 序列化节点
     */
    serializeNodes(nodes) {
        return nodes.map(node => ({
            type: node.type,
            name: node.name,
            x: node.x,
            y: node.y,
            properties: { ...node.properties },
            children: node.children ? this.serializeNodes(node.children) : []
        }));
    }

    /**
     * 实例化模板
     */
    instantiateTemplate(templateId, offsetX = 0, offsetY = 0) {
        const template = this.getTemplate(templateId);
        if (!template) {
            throw new Error(`Template '${templateId}' not found`);
        }

        return this.createNodesFromTemplate(template.nodes, offsetX, offsetY);
    }

    /**
     * 从模板创建节点
     */
    createNodesFromTemplate(templateNodes, offsetX = 0, offsetY = 0) {
        const createdNodes = [];
        const nodeMap = new Map();
        
        // 确保有NodeFactory实例
        if (typeof NodeFactory === 'undefined') {
            throw new Error('NodeFactory not available');
        }
        
        // 创建所有节点
        const createNode = (nodeData, parent = null) => {
            const node = nodeFactory.createNode(nodeData.type, nodeData.name);
            node.setPosition(nodeData.x + offsetX, nodeData.y + offsetY);
            
            if (nodeData.properties) {
                Object.assign(node.properties, nodeData.properties);
            }

            nodeMap.set(nodeData, node);
            createdNodes.push(node);

            // 递归创建子节点
            if (nodeData.children) {
                nodeData.children.forEach(childData => {
                    const childNode = createNode(childData, node);
                    node.addChild(childNode);
                });
            }

            return node;
        };

        templateNodes.forEach(nodeData => createNode(nodeData));
        
        return createdNodes;
    }

    /**
     * 保存用户自定义模板到本地存储
     */
    saveToLocalStorage() {
        const userTemplates = {};
        for (const [id, template] of this.templates) {
            if (!template.isDefault) {
                userTemplates[id] = template;
            }
        }
        localStorage.setItem('behaviorTree_userTemplates', JSON.stringify(userTemplates));
    }

    /**
     * 从本地存储加载用户模板
     */
    loadFromLocalStorage() {
        try {
            const stored = localStorage.getItem('behaviorTree_userTemplates');
            if (stored) {
                const userTemplates = JSON.parse(stored);
                for (const [id, template] of Object.entries(userTemplates)) {
                    this.templates.set(id, template);
                }
            }
        } catch (error) {
            console.error('加载用户模板失败:', error);
        }
    }

    /**
     * 导出模板
     */
    exportTemplate(templateId) {
        const template = this.getTemplate(templateId);
        if (!template) return null;

        return {
            ...template,
            exportedAt: new Date(),
            version: '1.0.0'
        };
    }

    /**
     * 导入模板
     */
    importTemplate(templateData) {
        if (!templateData.id || !templateData.name || !templateData.nodes) {
            throw new Error('Invalid template data');
        }

        this.addTemplate(templateData.id, {
            ...templateData,
            importedAt: new Date()
        });

        return templateData.id;
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BehaviorTreeTemplates;
} else if (typeof window !== 'undefined') {
    window.BehaviorTreeTemplates = BehaviorTreeTemplates;
} 