# @kww/harness

> 通用工程约束框架 - 铁律系统、检查点验证、测试门控

## 简介

`@kww/harness` 是一个通用的工程约束框架，帮助团队建立和强制执行代码质量标准。

### 核心功能

| 功能 | 说明 |
|------|------|
| **铁律系统** | 定义和检查强制规则，违规则阻止操作 |
| **检查点验证** | 验证工作流步骤的结果是否符合预期 |
| **测试门控** | 禁止自评通过，必须通过真实测试 |
| **预设系统** | 提供 strict/standard/relaxed 三种预设 |
| **CLI 工具** | 命令行工具执行检查 |

## 安装

```bash
npm install @kww/harness
```

## 快速开始

### 1. 初始化项目

```bash
npx harness init --preset standard
```

这会创建：
- `.harness/presets.yml` - 预设配置
- `.github/workflows/harness-check.yml` - CI 检查

### 2. 配置铁律

创建 `.harness/iron-laws.yml`：

```yaml
iron_laws:
  - id: no_self_approval
    rule: "禁止自评通过"
    message: "任务必须通过测试验证，不能自评完成"
    severity: error
  
  - id: test_required
    rule: "代码变更必须有测试"
    message: "修改代码时必须添加或更新测试"
    severity: warning
```

### 3. CLI 命令

```bash
# 检查铁律
harness check

# 验证检查点
harness validate

# 测试门控
harness passes-gate

# 初始化项目
harness init --preset strict

# 生成报告
harness report --output html
```

### 4. 在 CI 中使用

```yaml
# .github/workflows/ci.yml
jobs:
  harness-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npx harness check
      - run: npx harness passes-gate
```

### 5. 在代码中使用

```typescript
import { IronLawChecker, CheckpointValidator, PassesGate } from '@kww/harness';

// 检查铁律
const violations = await IronLawChecker.check(context);
if (violations.length > 0) {
  console.error('Iron law violated:', violations[0].message);
}

// 验证检查点
const checkpoint = await CheckpointValidator.validate({
  id: 'pre-commit',
  checks: ['test_pass', 'lint_pass'],
});

// 测试门控
const gate = new PassesGate({ requireEvidence: true });
const result = await gate.verify();
if (!result.passed) {
  throw new Error('Passes gate failed');
}
```

## 预设系统

| 预设 | 说明 |
|------|------|
| `strict` | 严格模式，所有检查都是 error 级别 |
| `standard` | 标准模式，推荐使用 |
| `relaxed` | 宽松模式，适合原型开发 |

## 项目模板

提供多种项目模板，预置 harness 配置：

- `node-api` - Node.js API 项目
- `nextjs-app` - Next.js 应用
- `python-api` - Python API 项目

```bash
# 从模板创建项目
harness init --template node-api
```

## API 文档

### IronLawChecker

```typescript
interface IronLawChecker {
  // 检查铁律
  static check(context: IronLawContext): Promise<IronLawViolation[]>;
  
  // 加载配置
  static loadConfig(path: string): Promise<IronLawConfig>;
}
```

### CheckpointValidator

```typescript
interface CheckpointValidator {
  // 验证检查点
  static validate(checkpoint: CheckpointInput): Promise<CheckpointResult>;
  
  // 注册检查器
  static register(type: string, handler: CheckHandler): void;
}
```

### PassesGate

```typescript
interface PassesGate {
  constructor(config: PassesGateConfig);
  
  // 验证是否通过
  verify(): Promise<PassesGateResult>;
}
```

## 开发

```bash
# 安装依赖
npm install

# 构建
npm run build

# 测试
npm test

# 监听模式
npm run dev
```

## 许可证

MIT © kww
