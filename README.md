# @dommaker/harness

> 通用工程约束框架 - 铁律系统、门禁系统、检查点验证、拦截器

## 简介

`@dommaker/harness` 是一个通用的工程约束框架，帮助团队建立和强制执行代码质量标准。

### 核心功能

| 功能 | 说明 |
|------|------|
| **铁律系统** | 16 条内置约束（4 Iron Laws + 10 Guidelines + 2 Tips） |
| **门禁系统** | 6 种门禁（测试、审查、安全、性能、契约、检查点） |
| **检查点验证** | 验证工作流步骤的结果是否符合预期 |
| **拦截器** | 抽象拦截框架，自动执行 enforcement |
| **Session 管理** | 启动检查点 + 结束状态管理 |
| **预设系统** | 提供 strict/standard/relaxed 三种预设 |
| **Execution Trace** | 轻量记录约束检查，异常检测，诊断系统 |
| **Spec 验证** | 验证架构文档、模块定义、API 定义 |
| **项目级自定义约束** | 扩展/覆盖内置约束，无需 fork |
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

# 输出配置代码片段（不创建文件）
harness init --print-snippets

# 检查铁律
harness check

# 列出所有铁律
harness check --list

# 查看状态（统计、异常、建议）
harness status

# 查看详细状态
harness status --detail

# 只显示异常
harness status --anomalies

# 一键执行诊断+提案流程
harness flow

# 验证检查点
harness validate

# 测试门控
harness passes-gate

# 生成报告
harness report

# [已弃用] 请使用 harness status
harness traces stats
harness traces summary
harness traces anomalies
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

### 5. Spec 验证

验证架构文档、模块定义、API 定义等 Spec 文件：

```bash
# 验证所有 Spec 文件
harness spec

# 验证暂存文件（pre-commit）
harness spec --staged

# 验证指定文件
harness spec --file ARCHITECTURE.md

# 使用自定义 Schema
harness spec --schema ./my-specs/schemas

# 列出支持的 Spec 类型
harness spec list
```

**项目自定义 Schema**：

项目可以定义自己的 Spec Schema，在 `src/specs/schemas/index.ts` 中导出 `validate` 函数：

```typescript
// src/specs/schemas/index.ts
import { z } from 'zod';

export const ArchitectureSchema = z.object({
  name: z.string(),
  version: z.string(),
  modules: z.array(z.string()),
});

export async function validate(content: string, filePath: string) {
  // 解析并验证内容
  // 返回 SpecValidationResult
}
```

### 6. 在代码中使用

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

### 7. 门禁系统

harness 提供完整的门禁系统，支持多种门禁类型：

| 门禁 | 类 | 说明 |
|------|-----|------|
| 测试门控 | `PassesGate` | 禁止自评通过，必须通过真实测试 |
| 审查门禁 | `ReviewGate` | 检查 GitHub PR 审查状态 |
| 安全门禁 | `SecurityGate` | npm audit 安全漏洞扫描 |
| 性能门禁 | `PerformanceGate` | 响应时间、覆盖率、打包大小检查 |
| 契约门禁 | `ContractGate` | OpenAPI 契约验证 |
| 检查点验证 | `CheckpointValidator` | 验证工作流步骤结果 |

**使用门禁**：

```typescript
import {
  PassesGate,
  ReviewGate,
  SecurityGate,
  PerformanceGate,
  ContractGate,
  CheckpointValidator,
} from '@dommaker/harness';

// 测试门控
const passesGate = new PassesGate({ requireEvidence: true });
const testResult = await passesGate.runTests();

// 审查门禁
const reviewGate = new ReviewGate({ minReviewers: 2 });
const reviewResult = await reviewGate.check({
  projectId: 'my-project',
  projectPath: '/path/to/project',
  prNumber: 123,
});

// 安全门禁
const securityGate = new SecurityGate({ severityThreshold: 'high' });
const securityResult = await securityGate.scan({
  projectId: 'my-project',
  projectPath: '/path/to/project',
});

// 性能门禁（带超时）
const performanceGate = new PerformanceGate({
  thresholds: {
    maxResponseTime: 500,
    minCoverage: 80,
    maxBundleSize: 1024,
  },
  coverageTimeout: 120000,  // 2分钟超时
});
const perfResult = await performanceGate.check({
  projectId: 'my-project',
  projectPath: '/path/to/project',
});

// 契约门禁
const contractGate = new ContractGate({ strict: true });
const contractResult = await contractGate.check({
  projectId: 'my-project',
  projectPath: '/path/to/project',
  newContractPath: '/path/to/openapi.yaml',
});

// 检查点验证
const checkpointValidator = CheckpointValidator.getInstance();
const checkpointResult = await checkpointValidator.validate(checkpoints, {
  workdir: '/path/to/project',
});
```

**门禁结果**：

```typescript
interface GateResult {
  gate: string;           // 门禁类型
  passed: boolean;        // 是否通过
  message: string;        // 结果消息
  details?: {             // 详细信息
    metrics?: object;     // 性能指标
    failures?: string[];  // 失败项
    warnings?: string[];  // 警告项
  };
  timestamp: string;      // 时间戳
  duration?: number;      // 执行时长（毫秒）
}
```

**PerformanceGate 超时配置**：

```typescript
const gate = new PerformanceGate({
  thresholds: { minCoverage: 80 },
  coverageTimeout: 60000,   // 覆盖率测试超时（毫秒）
  benchmarkTimeout: 30000,  // 基准测试超时（毫秒）
});

// 动态设置超时
gate.setTimeouts({ coverage: 120000 });
```

### 8. 使用拦截器

拦截器自动执行 enforcement，无需手动调用检查 API：

```typescript
import { 
  interceptor, 
  registerExecutor,
  interceptOperation,
  claimOperation,
  type EnforcementExecutor,
  type ConstraintContext,
} from '@dommaker/harness';

// 1. 注册执行器（使用者实现具体逻辑）
registerExecutor('verify-completion', {
  description: '验证完成声明：运行测试命令',
  supportedParams: ['command', 'timeout'],
  async execute(context) {
    // 使用者自定义验证逻辑
    const result = await exec('npm test', { cwd: context.projectPath });
    return {
      passed: result.success,
      evidence: result.stdout,
    };
  },
});

// 2. 在关键操作前拦截
try {
  // 拦截 task_completion_claim 操作
  // 自动查找适用的约束并执行对应的 enforcement
  await claimOperation('task_completion_claim', {
    operation: 'task_completion_claim',
    projectPath: '/path/to/project',
    sessionId: 'session-123',
  });
  
  // 拦截通过，可以宣布完成
  await announceCompletion();
} catch (e) {
  // 拦截失败，铁律违规
  console.error('必须先验证才能完成');
}

// 3. 查询拦截结果（不抛异常）
const result = await interceptOperation('task_completion_claim', context);
if (result.passed) {
  console.log('✅ 通过拦截');
} else {
  console.log('❌ 约束违规:', result.violations);
}
```

**拦截器 vs 手动检查**：

| 方式 | 特点 |
|------|------|
| 手动检查 | `checkConstraints()` 需要手动调用 API |
| 拦截器 | 自动执行 enforcement，抽象框架，使用者实现逻辑 |

**内置 enforcement IDs**：

| enforcement | 说明 |
|-------------|------|
| verify-completion | 验证完成声明：运行测试 |
| verify-e2e | 验证端到端测试 |
| debug-systematic | 系统性调试检查 |
| reuse-first | 复用优先检查 |
| update-capabilities | CAPABILITIES.md 同步检查 |
| tdd-cycle | TDD 循环检查 |
| passes-gate | 测试门控 |
| checkpoint-required | 检查点必须通过 |
| check-coverage | 覆盖率检查 |
| require-discussion | 设计决策讨论检查 |

## 内置约束（16 条）

| ID | 规则 | 层级 | 严重性 |
|---|------|------|:------:|
| `no_bypass_checkpoint` | 禁止跳过检查点 | iron_law | 🔴 error |
| `no_self_approval` | 禁止自评通过 | iron_law | 🔴 error |
| `no_completion_without_verification` | 完成必须有验证证据 | iron_law | 🔴 error |
| `no_test_simplification` | 禁止擅自简化测试 | iron_law | 🔴 error |
| `no_fix_without_root_cause` | 修复前必须找到根因 | guideline | 🔴 error |
| `no_code_without_test` | 写代码前必须有测试 | guideline | 🔴 error |
| `no_any_type` | 禁止使用 any 类型 | guideline | 🟡 warning |
| `simplest_solution_first` | 优先选择最简方案 | guideline | 🟡 warning |
| `no_creation_without_reuse_check` | 创建前必须检查可复用 | guideline | 🟡 warning |
| `capability_sync` | 代码变更必须更新 CAPABILITIES.md | guideline | 🟡 warning |
| `no_simplification_without_approval` | 不能擅自简化逻辑 | guideline | 🟡 warning |
| `no_skill_without_test` | 创建技能前必须有测试 | guideline | 🟡 warning |
| `test_coverage_required` | 测试覆盖率必须达标 | guideline | 🟡 warning |
| `design_decision_requires_discussion` | 设计决策必须先讨论 | guideline | 🟡 warning |
| `readme_required` | 新模块必须有 README | tip | 🔵 info |
| `doc_required_for_public_api` | 公共 API 必须有文档 | tip | 🔵 info |

## 预设系统

| 预设 | 说明 |
|------|------|
| `strict` | 严格模式，所有检查启用 |
| `standard` | 标准模式，推荐使用 |
| `relaxed` | 宽松模式，警告不阻止 |

## 自定义约束（v0.4+）

### 扩展例外（v0.6+）

使用 `extend_exceptions` 追加例外，保留内置例外：

```yaml
# .harness/custom-constraints.yml
custom_constraints:
  no_fix_without_root_cause:
    extend_exceptions:
      - my_special_case_1
      - my_special_case_2
```

结果：内置例外 + 新增例外

### 完全覆盖

使用 `exceptions` 完全覆盖内置例外：

```yaml
# .harness/custom-constraints.yml
custom_constraints:
  no_fix_without_root_cause:
    level: guideline
    rule: Do not fix without root cause
    message: 禁止没有根因分析就修复
    trigger: bug_fix
    exceptions:
      - my_only_exception
```

结果：只使用自定义例外

### 混合模式

同时使用 `exceptions` 和 `extend_exceptions`：

```yaml
custom_constraints:
  no_fix_without_root_cause:
    exceptions:
      - my_new_exception
    extend_exceptions:
      - another_exception
```

结果：内置例外 + my_new_exception + another_exception

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

### ReviewGate

```typescript
class ReviewGate {
  constructor(config: ReviewGateConfig);
  
  check(context: GateContext): Promise<GateResult>;
  setMinReviewers(count: number): void;
}
```

### SecurityGate

```typescript
class SecurityGate {
  constructor(config: SecurityGateConfig);
  
  scan(context: GateContext): Promise<GateResult>;
}
```

### PerformanceGate

```typescript
class PerformanceGate {
  constructor(config: PerformanceGateConfig);
  
  check(context: GateContext): Promise<GateResult>;
  runBenchmark(context: GateContext): Promise<BenchmarkResult>;
  setThresholds(thresholds: Partial<PerformanceThresholds>): void;
  setTimeouts(options: { coverage?: number; benchmark?: number }): void;
}
```

### ContractGate

```typescript
class ContractGate {
  constructor(config: ContractGateConfig);
  
  check(context: GateContext): Promise<GateResult>;
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

---

## Execution Trace 系统（v0.3+）

### 概念

Execution Trace 是约束检查的轻量记录，用于：
- 统计约束触发频率
- 检测异常模式（高频绕过、失败率上升）
- 为 Agent 诊断提供数据基础

### 设计原则

| 原则 | 说明 |
|------|------|
| **零 Token 成本** | 记录和统计都不调用 LLM |
| **轻量记录** | 只记录核心字段，不记录代码片段 |
| **异步分析** | 统计每小时执行，异常检测每日执行 |
| **按需诊断** | Agent 仅在检测到异常时才介入 |

### Trace 数据结构

```typescript
interface ExecutionTrace {
  constraintId: string;     // 约束 ID
  level: 'iron_law' | 'guideline' | 'tip';
  timestamp: number;        // Unix timestamp
  result: 'pass' | 'fail' | 'bypassed';
  operation?: string;       // 触发条件
  exceptionApplied?: string; // 例外类型
}
```

### 自动记录

约束检查时自动记录：

```typescript
import { checkConstraints } from '@dommaker/harness';

// 每次检查都会自动记录 trace
const result = await checkConstraints(context);
// Trace 已写入 .harness/traces/execution.log
```

### Trace 文件位置

```
.harness/traces/
├── execution.log           # 当前 trace 文件
├── execution-2026-04-05.log  # 滚动备份（超出 10MB 时）
├── summary.json            # 统计汇总
```

### 统计汇总

每小时自动执行：

```typescript
import { TraceAnalyzer } from '@dommaker/harness';

const analyzer = new TraceAnalyzer();
const summaries = analyzer.runHourlySummary();

// 输出：
// [
//   { constraintId: 'no_fix_without_root_cause', passRate: 0.7, bypassRate: 0.1 },
//   { constraintId: 'no_code_without_test', passRate: 0.9, bypassRate: 0 },
// ]
```

### 异常检测

每日自动执行：

```typescript
const anomalies = analyzer.runDailyAnomalyCheck();

// 检测类型：
// - high_bypass_rate：绕过率 > 30%
// - rising_fail_rate：失败率上升趋势
// - exception_overuse：例外使用率 > 40%
```

### CLI 使用

```bash
# 查看 trace 文件统计
harness traces stats

# 查看最近 24 小时的约束汇总
harness traces summary --hours 24

# 检测异常
harness traces anomalies

# JSON 格式输出
harness traces summary --format json

# 运行诊断
harness diagnose run --hours 24 --save

# 查看诊断列表
harness diagnose list

# 生成提案
harness propose generate --save

# 审核提案
harness propose review --diagnosis <id> --accept

# 查看实施指导
harness propose implement --diagnosis <id>
```

### 成本控制

| 活动 | 频率 | Token 成本 |
|------|------|:----------:|
| Trace 记录 | 每次检查 | 0 |
| 统计汇总 | 每小时 | 0 |
| 异常检测 | 每日 | 0（未触发）~500（触发） |
| Agent 诊断 | 按需 | ~2000 |

**对比 Meta-Harness**：百万级 vs 5500/周，成本降低 **180 倍**。