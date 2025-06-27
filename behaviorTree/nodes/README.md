# 行为树节点系统

这个文件夹包含了行为树编辑器的所有节点实现，每个节点类型都有自己的文件，便于管理和扩展。

## 文件结构

```
nodes/
├── BaseNode.js          # 基础节点类
├── SelectorNode.js      # 选择器节点
├── SequenceNode.js      # 序列器节点
├── ParallelNode.js      # 并行器节点
├── InverterNode.js      # 反转器节点
├── RepeaterNode.js      # 重复器节点
├── ActionNode.js        # 动作节点
├── ConditionNode.js     # 条件节点
├── NodeFactory.js       # 节点工厂
├── index.js            # 模块索引
└── README.md           # 说明文档
```

## 节点类型

### 控制节点（Control Nodes）

#### 1. 选择器节点 (SelectorNode)
- **功能**: 按顺序执行子节点，直到有一个返回SUCCESS或RUNNING
- **图标**: `fas fa-code-branch`
- **颜色**: 绿色 (#4CAF50)
- **配置参数**:
  - `randomOrder`: 是否随机顺序执行
  - `memoryType`: 记忆类型（none, selective, full）
  - `priority`: 优先级类型（order, weight, dynamic）

#### 2. 序列器节点 (SequenceNode)
- **功能**: 按顺序执行子节点，直到有一个返回FAILURE或RUNNING
- **图标**: `fas fa-list-ol`
- **颜色**: 蓝色 (#2196F3)
- **配置参数**:
  - `abortOnFailure`: 失败时是否立即中止
  - `continueOnSuccess`: 成功时是否继续下一个
  - `resetOnRestart`: 重新开始时是否重置状态

#### 3. 并行器节点 (ParallelNode)
- **功能**: 同时执行所有子节点，根据策略决定成功/失败条件
- **图标**: `fas fa-grip-lines`
- **颜色**: 橙色 (#FF9800)
- **配置参数**:
  - `policy`: 执行策略（require_all, require_one, require_majority, custom）
  - `successThreshold`: 成功阈值
  - `failureThreshold`: 失败阈值
  - `maxConcurrency`: 最大并发数

### 装饰器节点（Decorator Nodes）

#### 4. 反转器节点 (InverterNode)
- **功能**: 反转子节点的执行结果（SUCCESS变FAILURE，FAILURE变SUCCESS）
- **图标**: `fas fa-exclamation`
- **颜色**: 紫色 (#9C27B0)
- **配置参数**:
  - `invertRunning`: 是否反转RUNNING状态
  - `invertError`: 是否反转ERROR状态

#### 5. 重复器节点 (RepeaterNode)
- **功能**: 重复执行子节点指定次数或直到满足条件
- **图标**: `fas fa-redo`
- **颜色**: 红色 (#F44336)
- **配置参数**:
  - `repeatCount`: 重复次数（-1表示无限重复）
  - `repeatUntil`: 重复条件（count, success, failure, always）
  - `maxIterations`: 最大迭代次数
  - `resetChildOnRepeat`: 每次重复时是否重置子节点

### 叶子节点（Leaf Nodes）

#### 6. 动作节点 (ActionNode)
- **功能**: 执行具体的动作或行为
- **图标**: `fas fa-play`
- **颜色**: 蓝灰色 (#607D8B)
- **配置参数**:
  - `actionType`: 动作类型（custom, move, attack, interact, wait）
  - `actionCode`: 自定义动作代码
  - `duration`: 执行持续时间
  - `retryCount`: 失败重试次数
  - 针对不同动作类型的特定参数

#### 7. 条件节点 (ConditionNode)
- **功能**: 检查某个条件是否满足
- **图标**: `fas fa-question`
- **颜色**: 棕色 (#795548)
- **配置参数**:
  - `conditionType`: 条件类型（custom, distance, health, variable, property）
  - `conditionCode`: 自定义条件代码
  - `operator`: 比较操作符
  - `expectedValue`: 期望值
  - 针对不同条件类型的特定参数

## 使用方法

### 1. 创建节点

```javascript
// 使用构造函数直接创建
const selector = new SelectorNode('我的选择器');

// 使用节点工厂创建
const action = nodeFactory.createNode(NodeType.ACTION, '我的动作');
```

### 2. 配置节点属性

```javascript
// 设置动作节点属性
action.properties.actionType = 'move';
action.properties.targetPosition = { x: 100, y: 200 };
action.properties.moveSpeed = 150;
```

### 3. 构建节点树

```javascript
const root = new SelectorNode('根节点');
const condition = new ConditionNode('检查条件');
const action = new ActionNode('执行动作');

root.addChild(condition);
root.addChild(action);
```

### 4. 执行节点树

```javascript
const context = {
    agent: { position: { x: 0, y: 0 }, health: 100 },
    world: worldInstance,
    logger: loggerInstance
};

const result = root.execute(context);
console.log('执行结果:', result);
```

### 5. 获取节点配置界面

```javascript
const config = action.getPropertyConfig();
// 使用config数据生成配置界面
```

## 扩展新节点

要添加新的节点类型，请按照以下步骤：

1. **创建节点类文件**
   - 继承 `BaseNode` 类
   - 实现必要的方法（`execute`, `getDefaultProperties` 等）

2. **在 `NodeFactory.js` 中注册**
   ```javascript
   this.registerNode(NodeType.NEW_NODE, NewNodeClass);
   ```

3. **在 `index.html` 中引入**
   ```html
   <script src="nodes/NewNode.js"></script>
   ```

4. **更新节点类型枚举**
   在 `BehaviorTreeNode.js` 中添加新的节点类型

## 节点状态

所有节点都有以下状态：

- `READY`: 准备状态
- `RUNNING`: 运行中
- `SUCCESS`: 成功
- `FAILURE`: 失败
- `ERROR`: 错误

## 调试和验证

每个节点都提供以下方法用于调试和验证：

- `validate()`: 验证节点配置是否正确
- `getDebugInfo()`: 获取调试信息
- `getProgress()`: 获取执行进度（0-1）

## 测试

运行 `test_nodes.html` 页面可以测试节点系统的各个功能。

## 注意事项

1. **性能**: 节点执行应该尽量高效，避免在 `execute` 方法中进行耗时操作
2. **状态管理**: 确保正确管理节点状态，避免状态不一致
3. **错误处理**: 在节点执行中妥善处理错误，避免整个树崩溃
4. **内存管理**: 及时清理不再使用的资源，避免内存泄漏 