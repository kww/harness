# @dommaker/harness

> 通用工程约束框架 - 铁律系统、检查点验证、测试门控

## 简介

`@dommaker/harness` 是一个通用的工程约束框架，帮助团队建立和强制执行代码质量标准。

### 核心功能

| 功能 | 说明 |
|------|------|
| **铁律系统** | 13 条内置铁律，违规则阻止操作 |
| **检查点验证** | 验证工作流步骤的结果是否符合预期 |
| **测试门控** | 禁止自评通过，必须通过真实测试 |
| **Session 管理** | 启动检查点 + 结束状态管理 |
| **预设系统** | 提供 strict/standard/relaxed 三种预设 |
| **CLI 工具** | 命令行工具执行检查 |

## 安装

```bash
npm install @dommaker/harness
```

## 快速开始

### 1. 初始化项目

```bash
npx harness init --preset standard
```

这会创建：
- `.harness/config.yml` - 预设配置
- `.harness/checkpoints.yml` - 示例检查点
- `CAPABILITIES.md` - 功能清单模板
- `.git/hooks/pre-commit` - Git 钩子（可选）
- `.github/workflows/harness-check.yml` - CI 检查（可选）

### 2. CLI 命令

```bash
# 初始化项目配置
harness init --preset standard

# 检查铁律
harness check

# 列出所有铁律
harness check --list

# 验证检查点
harness validate

# 测试门控
harness passes-gate

# 生成报告
harness report
```

### 3. 在 CI 中使用

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

### 4. 在代码中使用

```typescript
import { 
  IronLawChecker, 
  CheckpointValidator, 
  PassesGate,
  SessionStartup,
  CleanStateManager 
} from '@dommaker/harness';

// 检查铁律
const checker = IronLawChecker.getInstance();
const results = await checker.checkAll(context);

// 验证检查点
const validator = new CheckpointValidator();
const result = await validator.validate(checkpoints, context);

// 测试门控
const gate = new PassesGate({ requireEvidence: true });
const testResult = await gate.setPasses(taskId, true, workDir);

// Session 启动检查
const startup = new SessionStartup(workDir, checkpoints);
const { success, results } = await startup.run();

// Session 结束清理
const cleaner = new CleanStateManager();
const cleanResult = await cleaner.onSessionEnd(workDir, sessionInfo);
```

## 内置铁律（13 条）

| ID | 规则 | 严重性 |
|---|------|:------:|
| `no_simplification_without_approval` | 不能擅自简化逻辑 | 🔴 error |
| `no_fix_without_root_cause` | 修复前必须找到根因 | 🔴 error |
| `no_completion_without_verification` | 完成必须有验证证据 | 🔴 error |
| `no_skill_without_test` | 创建技能前必须有测试 | 🟡 warning |
| `no_code_without_test` | 写代码前必须有测试 | 🔴 error |
| `no_creation_without_reuse_check` | 创建前必须检查可复用 | 🟡 warning |
| `capability_sync` | 代码变更必须更新 CAPABILITIES.md | 🟡 warning |
| `no_any_type` | 禁止使用 any 类型 | 🟡 warning |
| `no_bypass_checkpoint` | 禁止跳过检查点 | 🔴 error |
| `test_coverage_required` | 测试覆盖率必须达标 | 🟡 warning |
| `no_self_approval` | 禁止自评通过 | 🔴 error |
| `doc_required_for_public_api` | 公共 API 必须有文档 | 🟡 warning |
| `readme_required` | 新模块必须有 README | 🔵 info |

## 预设系统

| 预设 | 说明 |
|------|------|
| `strict` | 严格模式，所有检查启用 |
| `standard` | 标准模式，推荐使用 |
| `relaxed` | 宽松模式，警告不阻止 |

## 项目模板

提供多种项目模板：

- `node-api` - Node.js API 项目
- `nextjs-app` - Next.js 应用
- `python-api` - Python API 项目

```bash
# 指定项目类型
harness init --type node-api
```

## API 文档

### IronLawChecker

```typescript
class IronLawChecker {
  static getInstance(): IronLawChecker;
  
  checkAll(context: IronLawContext): Promise<IronLawResult[]>;
  beforeExecution(context: IronLawContext): Promise<void>;
  checkIronLaw(lawId: string, context: IronLawContext): Promise<IronLawResult>;
}
```

### CheckpointValidator

```typescript
class CheckpointValidator {
  validate(checkpoints: Checkpoint[], context: CheckpointContext): Promise<CheckpointResult>;
}
```

### PassesGate

```typescript
class PassesGate {
  constructor(config: PassesGateConfig);
  
  setPasses(taskId: string, value: boolean, workDir: string): Promise<PassesGateResult>;
  runTests(): Promise<TestResult>;
}
```

### SessionStartup

```typescript
class SessionStartup {
  constructor(workDir: string, checkpoints: StartupCheckpoints);
  
  run(): Promise<{ success: boolean; results: StartupCheckpointResult[] }>;
  getCurrentTask(): Promise<{ task: any; index: number } | null>;
  generateReport(results: StartupCheckpointResult[]): string;
}
```

### CleanStateManager

```typescript
class CleanStateManager {
  constructor(config: CleanStateConfig);
  
  onSessionEnd(workDir: string, sessionInfo: SessionInfo): Promise<CleanStateResult>;
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
```

## 许可证

MIT © dommaker