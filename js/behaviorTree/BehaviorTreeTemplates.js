/**
 * 行为树模板库 - 常用节点组合模板
 * Behavior Tree Templates - Common Node Combination Templates
 */

class BehaviorTreeTemplates {
    constructor() {
        this.templates = new Map();
        this.initializeDefaultTemplates();
    }

    /**
     * 初始化默认模板
     */
    initializeDefaultTemplates() {
        // 巡逻AI模板
        this.addTemplate('patrol_ai', {
            name: '巡逻AI Patrol AI',
            description: '基础的巡逻AI行为模式，包含巡逻、追击、攻击等行为',
            category: 'AI',
            icon: 'fas fa-route',
            nodes: [
                {
                    type: 'selector',
                    name: '主选择器 Main Selector',
                    x: 0,
                    y: 0,
                    children: [
                        {
                            type: 'sequence',
                            name: '战斗序列 Combat Sequence',
                            x: -200,
                            y: 100,
                            children: [
                                {
                                    type: 'condition',
                                    name: '发现敌人 Enemy Detected',
                                    x: -300,
                                    y: 200,
                                    properties: {
                                        conditionType: 'enemyInRange',
                                        range: 10
                                    }
                                },
                                {
                                    type: 'action',
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
                            type: 'sequence',
                            name: '巡逻序列 Patrol Sequence',
                            x: 200,
                            y: 100,
                            children: [
                                {
                                    type: 'condition',
                                    name: '到达巡逻点 Reached Patrol Point',
                                    x: 100,
                                    y: 200,
                                    properties: {
                                        conditionType: 'atDestination',
                                        tolerance: 1
                                    }
                                },
                                {
                                    type: 'action',
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
        });

        // 对话系统模板
        this.addTemplate('dialogue_system', {
            name: '对话系统 Dialogue System',
            description: 'NPC对话处理系统，包含问候、对话选择、任务分配等',
            category: 'NPC',
            icon: 'fas fa-comments',
            nodes: [
                {
                    type: 'sequence',
                    name: '对话流程 Dialogue Flow',
                    x: 0,
                    y: 0,
                    children: [
                        {
                            type: 'condition',
                            name: '玩家接近 Player Nearby',
                            x: -100,
                            y: 100,
                            properties: {
                                conditionType: 'playerInRange',
                                range: 5
                            }
                        },
                        {
                            type: 'action',
                            name: '显示问候 Show Greeting',
                            x: 0,
                            y: 100,
                            properties: {
                                actionType: 'showDialogue',
                                text: 'Hello, traveler!'
                            }
                        },
                        {
                            type: 'selector',
                            name: '对话选择 Dialogue Options',
                            x: 100,
                            y: 100,
                            children: [
                                {
                                    type: 'sequence',
                                    name: '任务分支 Quest Branch',
                                    x: 50,
                                    y: 200,
                                    children: [
                                        {
                                            type: 'condition',
                                            name: '选择任务 Quest Selected',
                                            x: 0,
                                            y: 300
                                        },
                                        {
                                            type: 'action',
                                            name: '分配任务 Assign Quest',
                                            x: 100,
                                            y: 300
                                        }
                                    ]
                                },
                                {
                                    type: 'action',
                                    name: '告别 Say Goodbye',
                                    x: 150,
                                    y: 200
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
                    type: 'repeater',
                    name: '收集循环 Gathering Loop',
                    x: 0,
                    y: 0,
                    properties: {
                        repeatCount: -1 // 无限循环
                    },
                    children: [
                        {
                            type: 'sequence',
                            name: '收集序列 Gathering Sequence',
                            x: 0,
                            y: 100,
                            children: [
                                {
                                    type: 'condition',
                                    name: '背包未满 Inventory Not Full',
                                    x: -150,
                                    y: 200
                                },
                                {
                                    type: 'action',
                                    name: '寻找资源 Find Resource',
                                    x: -50,
                                    y: 200
                                },
                                {
                                    type: 'action',
                                    name: '移动到资源 Move to Resource',
                                    x: 50,
                                    y: 200
                                },
                                {
                                    type: 'action',
                                    name: '收集资源 Collect Resource',
                                    x: 150,
                                    y: 200
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
                    type: 'selector',
                    name: '状态选择器 State Selector',
                    x: 0,
                    y: 0,
                    children: [
                        {
                            type: 'sequence',
                            name: '空闲状态 Idle State',
                            x: -200,
                            y: 100,
                            children: [
                                {
                                    type: 'condition',
                                    name: '无任务 No Task',
                                    x: -200,
                                    y: 200
                                },
                                {
                                    type: 'action',
                                    name: '播放空闲动画 Play Idle Animation',
                                    x: -200,
                                    y: 300
                                }
                            ]
                        },
                        {
                            type: 'sequence',
                            name: '移动状态 Moving State',
                            x: 0,
                            y: 100,
                            children: [
                                {
                                    type: 'condition',
                                    name: '有移动目标 Has Move Target',
                                    x: 0,
                                    y: 200
                                },
                                {
                                    type: 'action',
                                    name: '执行移动 Execute Movement',
                                    x: 0,
                                    y: 300
                                }
                            ]
                        },
                        {
                            type: 'sequence',
                            name: '工作状态 Working State',
                            x: 200,
                            y: 100,
                            children: [
                                {
                                    type: 'condition',
                                    name: '有工作任务 Has Work Task',
                                    x: 200,
                                    y: 200
                                },
                                {
                                    type: 'action',
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
            description: '通用错误处理和重试机制',
            category: 'Utility',
            icon: 'fas fa-exclamation-triangle',
            nodes: [
                {
                    type: 'retry',
                    name: '重试器 Retry Handler',
                    x: 0,
                    y: 0,
                    properties: {
                        maxRetries: 3,
                        retryDelay: 1000
                    },
                    children: [
                        {
                            type: 'sequence',
                            name: '尝试执行 Try Execute',
                            x: 0,
                            y: 100,
                            children: [
                                {
                                    type: 'action',
                                    name: '执行任务 Execute Task',
                                    x: -50,
                                    y: 200
                                },
                                {
                                    type: 'condition',
                                    name: '检查结果 Check Result',
                                    x: 50,
                                    y: 200
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

        // 创建所有节点
        const createNode = (nodeData, parent = null) => {
            const node = new BehaviorTreeNode(nodeData.type, nodeData.name);
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