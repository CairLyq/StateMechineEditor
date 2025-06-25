# StateMachineEditor - 可视化状态机编辑器

<div align="center">

![StateMachineEditor Logo](https://via.placeholder.com/128x128/4CAF50/FFFFFF?text=SM)

**一个现代化的Web状态机可视化编辑器**

[![GitHub Stars](https://img.shields.io/github/stars/CairLyq/StateMechineEditor?style=flat-square)](https://github.com/CairLyq/StateMechineEditor/stargazers)
[![GitHub Forks](https://img.shields.io/github/forks/CairLyq/StateMechineEditor?style=flat-square)](https://github.com/CairLyq/StateMechineEditor/network)
[![GitHub Issues](https://img.shields.io/github/issues/CairLyq/StateMechineEditor?style=flat-square)](https://github.com/CairLyq/StateMechineEditor/issues)
[![License](https://img.shields.io/github/license/CairLyq/StateMechineEditor?style=flat-square)](https://github.com/CairLyq/StateMechineEditor/blob/main/LICENSE)

[English](#english) | [中文](#中文)

</div>

## 🚀 在线演示

📎 **[在线体验](https://cairlyq.github.io/StateMechineEditor/)** - 无需安装，即开即用

## 📖 项目简介

StateMachineEditor 是一个专业级的状态机可视化编辑器，提供直观的图形界面来设计和管理有限状态机。采用现代Web技术构建，支持实时模拟、数据导入导出等丰富功能。

### ✨ 核心特性

- 🎨 **现代化界面** - Material Design风格，深色主题，专业网格背景
- 🖱️ **直观交互** - 拖拽创建，右键连线，智能布局
- ⚡ **实时模拟** - 内置状态机模拟器，支持事件触发和状态追踪
- 💾 **数据管理** - 支持导入/导出JSON格式，完整项目保存
- 🔄 **智能连线** - 自动检测双向连线，平行布局，避免重叠
- 🎯 **用户友好** - 撤销/重做，快捷键支持，属性面板实时更新

## 🛠️ 安装使用

### 方式一：直接下载

```bash
# 克隆项目
git clone https://github.com/CairLyq/StateMechineEditor.git

# 进入项目目录
cd StateMechineEditor

# 在浏览器中打开 index.html
open index.html
```

### 方式二：在线使用

直接访问 [在线演示](https://cairlyq.github.io/StateMechineEditor/) 即可使用，无需本地安装。

### 方式三：本地服务器

```bash
# 使用Python启动本地服务器
python -m http.server 8000

# 或使用Node.js
npx serve .

# 访问 http://localhost:8000
```

## 📱 功能演示

### 🎨 界面展示

- **深色主题设计**：专业的视觉体验，减少眼部疲劳
- **网格背景**：精确定位，专业制图环境
- **高对比度**：自适应文字颜色，确保最佳可读性
- **响应式布局**：适配不同屏幕尺寸

### 🖱️ 交互操作

#### 创建状态
- 点击"添加状态"按钮
- 双击画布空白处
- 支持圆形节点，动态调整大小

#### 连接状态
- **传统模式**：点击"添加转换"按钮，依次选择状态
- **右键模式**：右键状态→"开始连线"→点击目标状态
- **智能布局**：自动识别双向连线，实现平行布局

#### 编辑元素
- 双击状态/转换进行编辑
- 属性面板实时显示详细信息
- 支持颜色自定义、初始/终止状态设置

### ⚡ 模拟功能

```javascript
// 模拟控制
1. 设置初始状态（绿色圆环标识）
2. 点击"模拟运行"开始
3. 输入事件名称，触发状态转换
4. 实时高亮当前状态
5. 自动检测终止状态
```

### 💾 数据管理

- **导出功能**：保存为JSON格式，包含完整状态机数据
- **导入功能**：加载已保存的状态机文件
- **数据格式**：标准化JSON结构，支持版本兼容

```json
{
  "states": [
    {
      "id": "state_0",
      "name": "初始状态",
      "x": 200,
      "y": 150,
      "isInitial": true,
      "isFinal": false,
      "color": "#4caf50"
    }
  ],
  "transitions": [
    {
      "id": "transition_123",
      "from": "state_0",
      "to": "state_1",
      "event": "start",
      "condition": ""
    }
  ],
  "metadata": {
    "created": "2024-01-01T00:00:00.000Z",
    "version": "1.0.0",
    "name": "状态机导出"
  }
}
```

## 🎮 使用指南

### 基础操作

| 操作 | 方法 | 快捷键 |
|------|------|--------|
| 创建状态 | 双击画布 / 点击按钮 | - |
| 移动状态 | 拖拽状态节点 | - |
| 连接状态 | 右键菜单 / 转换模式 | - |
| 删除元素 | 选中后按删除键 | `Delete` / `Backspace` |
| 撤销操作 | 点击撤销按钮 | `Ctrl+Z` |
| 重做操作 | 点击重做按钮 | `Ctrl+Y` |
| 缩放画布 | 鼠标滚轮 / 缩放按钮 | 滚轮 |
| 平移画布 | 拖拽空白区域 | 鼠标拖拽 |

### 高级功能

#### 🔄 智能连线系统
- **双向连线检测**：自动识别反向连线，实现平行布局
- **自循环支持**：状态可以连接到自身，形成自循环
- **视觉优化**：连线使用金黄色主题，高对比度显示

#### 🎯 右键连线模式
1. 右键点击起始状态
2. 选择"开始连线"
3. 出现金色虚线预览
4. 点击目标状态完成连线
5. 按 `Esc` 取消连线

#### 📊 实时统计
- 状态数量统计
- 转换数量统计
- 操作历史记录
- 模拟状态跟踪

## 🏗️ 技术架构

### 技术栈
- **前端框架**：原生JavaScript ES6+
- **UI框架**：TailwindCSS 3.4+
- **图标库**：Font Awesome 6.4
- **动画库**：Framer Motion（可选）
- **绘图技术**：SVG + Canvas

### 核心架构

```javascript
class StateMachineEditor {
    constructor() {
        // 核心数据
        this.states = new Map();           // 状态集合
        this.transitions = [];             // 转换集合
        this.selectedElement = null;       // 当前选中元素
        
        // 交互状态
        this.zoom = 1;                     // 缩放级别
        this.panX = 0; this.panY = 0;     // 平移偏移
        this.connectionMode = {};          // 连线模式状态
        
        // 模拟控制
        this.isSimulating = false;        // 模拟状态
        this.currentState = null;          // 当前状态
        
        // 历史管理
        this.history = [];                 // 操作历史
        this.historyIndex = -1;           // 历史索引
    }
    
    // 核心方法
    addState(x, y)                        // 添加状态
    addTransition(from, to, event)        // 添加转换
    updateTransitions()                   // 更新连线
    startSimulation()                     // 开始模拟
    exportStateMachine()                  // 导出数据
    importStateMachine()                  // 导入数据
    // ... 更多方法
}
```

### 设计模式
- **观察者模式**：UI更新和数据同步
- **命令模式**：撤销/重做功能实现
- **状态模式**：模拟器状态管理
- **工厂模式**：状态和转换对象创建

## 🌐 浏览器兼容性

| 浏览器 | 版本要求 | 支持状态 |
|--------|----------|----------|
| Chrome | 80+ | ✅ 完全支持 |
| Firefox | 75+ | ✅ 完全支持 |
| Safari | 13+ | ✅ 完全支持 |
| Edge | 80+ | ✅ 完全支持 |
| IE | - | ❌ 不支持 |

## 📁 项目结构

```
StateMachineEditor/
├── 📄 index.html                    # 主页面文件
├── 📁 js/
│   └── 📄 StateMachineEditor.js     # 核心JavaScript代码
├── 📁 lib/                          # 第三方库
│   ├── 📄 tailwindcss.3.4.16.js    # TailwindCSS框架
│   ├── 📄 font-awesome.6.4.0.css   # 图标库
│   └── 📄 framer-motion.js          # 动画库
├── 📁 src/                          # TypeScript源码
│   ├── 📄 HierarchicalStateMachine.ts
│   └── 📄 StateMachine.ts
├── 📄 README.md                     # 项目说明文档
├── 📄 debug-instructions.md         # 调试说明
└── 📄 test.html                     # 测试页面
```

## 🚧 开发路线图

### ✅ 已完成功能
- [x] 基础状态机编辑
- [x] 可视化界面设计
- [x] 拖拽交互功能
- [x] 右键连线模式
- [x] 实时模拟功能
- [x] 导入导出功能
- [x] 撤销重做系统
- [x] 响应式布局
- [x] 深色主题界面
- [x] 智能连线系统

### 🔄 进行中
- [ ] 性能优化
- [ ] 移动端适配
- [ ] 单元测试

### 📋 计划功能
- [ ] 分层状态机支持
- [ ] 状态机模板库
- [ ] 多种导出格式（PNG、PDF、SVG）
- [ ] 协作编辑功能
- [ ] 插件系统
- [ ] 国际化支持
- [ ] 主题定制
- [ ] 代码生成器

## 🤝 贡献指南

我们欢迎所有形式的贡献！请遵循以下步骤：

### 🐛 报告问题
1. 查看 [已知问题](https://github.com/CairLyq/StateMechineEditor/issues)
2. 创建详细的问题报告
3. 提供复现步骤和环境信息

### 💡 提交功能请求
1. 详细描述功能需求
2. 说明使用场景和价值
3. 提供设计建议（可选）

### 🔧 代码贡献
```bash
# 1. Fork 项目
git clone https://github.com/YOUR_USERNAME/StateMechineEditor.git

# 2. 创建功能分支
git checkout -b feature/amazing-feature

# 3. 提交更改
git commit -m "Add amazing feature"

# 4. 推送到分支
git push origin feature/amazing-feature

# 5. 创建 Pull Request
```

### 📝 代码规范
- 使用ES6+语法
- 遵循驼峰命名法
- 添加必要的注释
- 保持代码简洁清晰

## 📜 许可证

本项目采用 [MIT License](https://github.com/CairLyq/StateMechineEditor/blob/main/LICENSE) 许可证。

## 📞 联系方式

- **GitHub**: [@CairLyq](https://github.com/CairLyq)
- **项目地址**: [StateMechineEditor](https://github.com/CairLyq/StateMechineEditor)
- **在线演示**: [GitHub Pages](https://cairlyq.github.io/StateMechineEditor/)
- **问题反馈**: [GitHub Issues](https://github.com/CairLyq/StateMechineEditor/issues)

## 🙏 致谢

感谢所有为这个项目做出贡献的开发者和用户。特别感谢：

- [TailwindCSS](https://tailwindcss.com/) - 优秀的CSS框架
- [Font Awesome](https://fontawesome.com/) - 专业的图标库
- [MDN Web Docs](https://developer.mozilla.org/) - 优秀的技术文档

## ⭐ Star History

如果这个项目对你有帮助，请考虑给它一个 Star ⭐

[![Star History Chart](https://api.star-history.com/svg?repos=CairLyq/StateMechineEditor&type=Date)](https://star-history.com/#CairLyq/StateMechineEditor&Date)

---

<div align="center">

**让状态机设计变得简单而优雅** ✨

Made with ❤️ by [CairLyq](https://github.com/CairLyq)

</div> 