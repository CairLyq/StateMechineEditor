# 状态机编辑器架构说明

## 概述

本项目已完成模块化重构，将标准状态机与分层状态机分离，使用现代化的JavaScript架构，提供高可读性和可维护性的代码结构。

## 目录结构

```
stateMachine/
├── common/                    # 公共模块
│   ├── Constants.js          # 常量配置
│   ├── BaseEditor.js         # 基础编辑器类
│   └── UIComponents.js       # UI组件库
├── fsm/                      # 标准状态机模块
│   ├── index.html           # 标准状态机页面
│   └── StandardStateMachineEditor.js  # 标准状态机编辑器
└── hfsm/                     # 分层状态机模块
    ├── index.html           # 分层状态机页面
    └── HierarchicalStateMachineEditor.js  # 分层状态机编辑器
```

## 架构特点

### 1. 模块化设计
- **公共模块**: 抽取所有编辑器的公共功能，避免代码重复
- **专用模块**: 标准状态机和分层状态机分别独立开发和维护
- **清晰边界**: 模块间依赖关系明确，便于扩展

### 2. 现代化技术栈
- **ES6+ 语法**: 使用现代JavaScript特性
- **模块系统**: 采用ES6 import/export
- **类继承**: 基于现代JavaScript类语法
- **常量管理**: 集中管理所有配置和常量

### 3. 设计模式
- **继承模式**: BaseEditor作为抽象基类
- **组合模式**: UIComponents提供可复用组件
- **观察者模式**: 事件系统和状态管理
- **策略模式**: 不同编辑器的实现策略

## 核心模块说明

### Constants.js - 常量配置
包含所有硬编码值和配置：
- DOM元素ID常量
- CSS类名常量
- 默认配置参数
- 颜色主题配置
- 事件类型定义
- 消息模板

### BaseEditor.js - 基础编辑器
抽象基类，提供公共功能：
- DOM元素管理
- 事件监听器自动绑定
- 画布操作（拖动、缩放）
- 历史记录管理
- 模态框管理
- 文件导入导出
- 性能监控

### UIComponents.js - UI组件库
提供可复用的UI组件：
- 工具栏按钮
- 统计卡片
- 输入字段
- 模态框内容
- 通知消息
- 确认对话框

### StandardStateMachineEditor.js - 标准状态机编辑器
继承BaseEditor，实现标准状态机功能：
- 状态节点管理
- 转换连线管理
- 拖拽操作
- 模拟运行
- 右键菜单

### HierarchicalStateMachineEditor.js - 分层状态机编辑器
继承BaseEditor，实现分层状态机功能：
- 多层级状态管理
- 父子关系管理
- 层级渲染
- 复合状态处理
- 深度导航

## 页面访问

### 主页
- 路径: `/index.html`
- 功能: 编辑器选择页面，提供到各个编辑器的导航

### 标准状态机编辑器
- 路径: `/stateMachine/fsm/index.html`
- 功能: 创建和编辑标准的有限状态机

### 分层状态机编辑器
- 路径: `/stateMachine/hfsm/index.html`
- 功能: 创建和编辑复杂的分层状态机

## 技术优势

1. **代码复用**: 公共功能抽取到基类，减少重复代码
2. **可维护性**: 常量集中管理，易于修改和维护
3. **可扩展性**: 基于继承的架构，易于添加新功能
4. **现代化**: 使用最新的JavaScript特性和最佳实践
5. **模块化**: 清晰的模块边界，便于独立开发和测试
6. **性能优化**: 事件防抖、缓存机制、性能监控

## 开发指南

### 添加新功能
1. 在Constants.js中添加相关常量
2. 在BaseEditor.js中添加公共方法（如果适用）
3. 在具体编辑器中实现特定功能
4. 使用UIComponents.js中的组件保持UI一致性

### 修改配置
1. 所有配置都在Constants.js中
2. 颜色主题在COLORS对象中
3. 默认参数在DEFAULT_CONFIG对象中
4. 消息模板在MESSAGES对象中

### 调试和监控
1. 使用BaseEditor的日志系统
2. 启用性能监控功能
3. 使用浏览器开发者工具
4. 检查控制台错误和警告

## 未来扩展

该架构支持以下扩展：
- 添加新的状态机类型
- 集成更多UI组件
- 添加插件系统
- 支持多语言
- 添加协作功能
- 集成版本控制 