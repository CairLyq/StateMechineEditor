# 行为树编辑器 Behavior Tree Editor

一个专业级别的行为树可视化编辑器，支持创建、编辑、调试和导出功能。专为游戏开发者、机器人工程师和AI程序员设计。

## 功能特性 Features

### 🎨 直观的可视化界面
- 清晰的视觉层次和布局
- 不同类型节点使用不同形状和颜色
- 中英文混合标签设计
- 简洁的图标和图形元素

### 🔧 丰富的节点类型

#### 控制节点 Control Nodes
- **选择器 Selector**: OR逻辑，执行子节点直到成功
- **序列器 Sequence**: AND逻辑，按顺序执行所有子节点
- **并行器 Parallel**: 同时执行多个子节点

#### 装饰器节点 Decorator Nodes
- **反转器 Inverter**: 反转子节点的返回结果
- **重复器 Repeater**: 重复执行子节点
- **超时器 Timeout**: 限制子节点的执行时间
- **冷却器 Cooldown**: 添加执行间隔

#### 叶子节点 Leaf Nodes
- **动作节点 Action**: 执行具体的动作
- **条件节点 Condition**: 检查特定条件
- **等待节点 Wait**: 等待指定时间

### 💡 强大的编辑功能
- 拖拽创建和编辑节点
- 可视化连接节点关系
- 撤销/重做操作
- 复制/粘贴节点
- 多选和批量操作
- 自动布局和对齐

### 🔍 实时调试系统
- 行为树模拟执行
- 断点调试支持
- 执行状态可视化
- 实时日志输出
- 黑板数据监控
- 性能统计分析

### 📊 数据可视化
- 执行统计图表
- 性能分析报告
- 树结构信息
- 小地图导航

## 使用方法 Usage

### 基本操作

#### 创建节点
1. 在左侧节点面板选择所需的节点类型
2. 点击节点按钮，节点将在画布中心创建
3. 拖拽节点到合适位置

#### 连接节点
1. 拖拽父节点的输出连接点到子节点的输入连接点
2. 或使用连接模式工具栏按钮

#### 编辑属性
1. 选择节点查看属性面板
2. 修改节点名称、类型和描述
3. 配置节点特定的参数

#### 运行和调试
1. 点击运行按钮开始执行行为树
2. 观察节点状态变化和执行日志
3. 使用单步执行进行详细调试
4. 设置断点进行精确控制

### 快捷键 Shortcuts

- `Ctrl+Z` / `Cmd+Z`: 撤销
- `Ctrl+Shift+Z` / `Cmd+Shift+Z`: 重做
- `Ctrl+C` / `Cmd+C`: 复制选中节点
- `Ctrl+V` / `Cmd+V`: 粘贴节点
- `Ctrl+A` / `Cmd+A`: 全选节点
- `Delete`: 删除选中节点
- `Escape`: 取消选择/退出当前模式

### 工具栏功能

#### 编辑工具
- 撤销/重做
- 删除节点
- 缩放控制
- 适应屏幕

#### 模拟控制
- 运行/暂停/停止
- 单步执行
- 调试模式切换

#### 文件操作
- 导出JSON格式
- 导入行为树文件
- 保存为图片

## 节点说明 Node Types

### 控制节点详解

#### 选择器 Selector
```
功能: 从左到右执行子节点，直到有一个返回成功
返回: 第一个成功的子节点结果，如果都失败则返回失败
用途: 实现备选方案，如"攻击敌人 || 寻找敌人 || 巡逻"
```

#### 序列器 Sequence
```
功能: 从左到右执行子节点，直到有一个返回失败
返回: 第一个失败的子节点结果，如果都成功则返回成功
用途: 实现复合动作，如"接近敌人 && 瞄准 && 攻击"
```

#### 并行器 Parallel
```
功能: 同时执行所有子节点
返回: 根据成功策略决定（全部成功/部分成功）
用途: 实现多任务处理，如"移动 && 播放动画 && 播放音效"
```

### 装饰器节点详解

#### 反转器 Inverter
```
功能: 反转子节点的返回值
返回: 成功→失败，失败→成功
用途: 实现否定条件，如"NOT 敌人在视野内"
```

#### 重复器 Repeater
```
功能: 重复执行子节点指定次数或无限次
参数: maxRepeats (最大重复次数，-1为无限)
用途: 实现循环行为，如"重复巡逻"
```

## 调试功能 Debugging

### 执行状态
- **准备 Ready**: 节点未执行
- **运行中 Running**: 节点正在执行
- **成功 Success**: 节点执行成功
- **失败 Failure**: 节点执行失败
- **错误 Error**: 节点执行出错

### 黑板系统
黑板是行为树的共享数据存储，用于：
- 存储全局变量
- 节点间数据传递
- 条件判断依据
- 状态持久化

### 调试工具
- **断点**: 在指定节点暂停执行
- **单步执行**: 逐个节点执行分析
- **执行历史**: 查看详细执行记录
- **性能监控**: 分析执行效率

## 最佳实践 Best Practices

### 设计原则
1. **模块化**: 将复杂行为分解为简单子树
2. **可重用**: 设计通用的子树模块
3. **可读性**: 使用清晰的节点命名
4. **性能**: 避免过深的嵌套结构

### 常见模式
```
决策模式: Selector + Condition + Action
序列模式: Sequence + Condition + Action + Action
循环模式: Repeater + Sequence + Actions
状态机模式: Selector + (Condition + Sequence)*
```

### 调试技巧
1. 使用断点定位问题节点
2. 监控黑板数据变化
3. 分析执行统计找出瓶颈
4. 使用日志追踪执行流程

## 文件格式 File Format

行为树以JSON格式存储：

```json
{
  "root": {
    "id": "node_123456789",
    "type": "root",
    "name": "根节点 Root",
    "x": 400,
    "y": 50,
    "children": [...]
  },
  "metadata": {
    "name": "示例行为树",
    "description": "这是一个示例行为树",
    "version": "1.0.0",
    "created": "2024-01-01T00:00:00.000Z"
  }
}
```

## 系统要求 Requirements

### 浏览器支持
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

### 外部依赖
- TailwindCSS 3.4+ (通过CDN)
- Font Awesome 6.4+ (通过CDN)
- Framer Motion 10.16+ (通过CDN)

## 开发扩展 Development

### 自定义节点类型
```javascript
// 继承BehaviorTreeNode创建自定义节点
class CustomNode extends BehaviorTreeNode {
    constructor(name) {
        super('custom', name);
        // 自定义属性
        this.customProperty = 'value';
    }
    
    execute(context) {
        // 自定义执行逻辑
        return NodeStatus.SUCCESS;
    }
}
```

### 扩展渲染器
```javascript
// 自定义节点渲染
renderer.renderCustomNode = function(node) {
    // 自定义渲染逻辑
};
```

### 添加新功能
```javascript
// 扩展编辑器功能
editor.customFunction = function() {
    // 自定义功能实现
};
```

## 许可证 License

本项目采用 MIT 许可证，详见 LICENSE 文件。

## 贡献 Contributing

欢迎提交问题报告和功能建议！

1. Fork 本仓库
2. 创建功能分支
3. 提交变更
4. 发起 Pull Request

## 联系方式 Contact

如有疑问或建议，请通过以下方式联系：

- 邮箱: [your-email@example.com]
- 问题反馈: [GitHub Issues]
- 文档: [项目Wiki]

---

**行为树编辑器** - 让AI行为设计变得简单而强大！ 