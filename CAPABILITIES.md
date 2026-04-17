# harness 功能清单

> 最后更新: 2026-04-17 by titi
> 铁律：代码变更必须同步更新此文件

## 核心模块 (src/core/)

| 模块 | 文件 | 功能 | 状态 | 最后修改 |
|------|------|------|:----:|---------|
| 约束定义 | core/constraints/definitions.ts | 16 条内置约束（Iron Laws + Guidelines + Tips） | ✅ | 2026-04-10 |
| 约束检查 | core/constraints/checker.ts | 三层约束检查引擎 | ✅ | 2026-04-10 |
| 拦截器 | core/constraints/interceptor.ts | 自动 enforcement 执行 | ✅ | 2026-04-10 |
| 预设系统 | presets/ | strict/standard/relaxed 三种预设 | ✅ | 2026-04-10 |

## 门禁系统 (src/gates/)

| 模块 | 文件 | 功能 | 状态 | 最后修改 |
|------|------|------|:----:|---------|
| 测试门禁 | gates/passes-gate.ts | 测试证据验证 | ✅ | 2026-04-04 |
| 审查门禁 | gates/review-gate.ts | 代码审查验证 | ✅ | 2026-04-04 |
| 安全门禁 | gates/security-gate.ts | 安全检查验证 | ✅ | 2026-04-04 |
| 性能门禁 | gates/performance-gate.ts | 性能指标验证 | ✅ | 2026-04-04 |
| 契约门禁 | gates/contract-gate.ts | API 契约验证 | ✅ | 2026-04-04 |
| 检查点验证 | gates/checkpoint-validator.ts | 步骤结果验证 | ✅ | 2026-04-04 |
| 验收标准 | gates/acceptance-criteria.ts | 需求验收验证 | ✅ | 2026-04-04 |

## 监控系统 (src/monitoring/)

| 模块 | 文件 | 功能 | 状态 | 最后修改 |
|------|------|------|:----:|---------|
| Trace 收集 | monitoring/traces.ts | 约束检查日志收集 | ✅ | 2026-04-16 |
| Trace 分析 | monitoring/trace-analyzer.ts | 统计汇总 + 异常检测 | ✅ | 2026-04-16 |
| 性能收集 | monitoring/performance-collector.ts | 性能日志收集 | ✅ | 2026-04-17 |
| 性能分析 | monitoring/performance-analyzer.ts | 性能统计 + 异常检测 | ✅ | 2026-04-17 |
| 约束医生 | monitoring/constraint-doctor.ts | 诊断报告生成 | ✅ | 2026-04-10 |
| 约束进化 | monitoring/constraint-evolver.ts | 约束提案系统 | ✅ | 2026-04-10 |

## 失败处理 (src/failure/) 🆕

| 模块 | 文件 | 功能 | 状态 | 最后修改 |
|------|------|------|:----:|---------|
| 类型定义 | failure/types.ts | ErrorType, FailureLevel, ClassificationRule | ✅ | 2026-04-17 |
| 错误分类 | failure/classifier.ts | ErrorClassifier（可扩展分类器） | ✅ | 2026-04-17 |
| 失败记录 | failure/recorder.ts | FailureRecorder（文件存储） | ✅ | 2026-04-17 |

## 类型系统 (src/types/)

| 模块 | 文件 | 功能 | 状态 | 最后修改 |
|------|------|------|:----:|---------|
| 约束类型 | types/constraint.ts | Constraint, ConstraintContext, ConstraintResult | ✅ | 2026-04-10 |
| 检查点类型 | types/checkpoint.ts | Checkpoint, CheckpointResult | ✅ | 2026-04-04 |
| 门禁类型 | types/passes-gate.ts | GateResult, TestEvidence | ✅ | 2026-04-04 |
| Session 类型 | types/session.ts | StartupCheckpoints, SessionInfo | ✅ | 2026-04-04 |
| Trace 类型 | types/trace.ts | ExecutionTrace, TraceSummary | ✅ | 2026-04-16 |
| Performance 类型 | types/performance.ts | PerformanceTrace, PerformanceSummary | ✅ | 2026-04-17 |
| Enforcement 类型 | types/enforcement.ts | EnforcementId, EnforcementExecutor | ✅ | 2026-04-10 |
| Spec 类型 | types/spec.ts | SpecDefinition, SpecValidationResult | ✅ | 2026-04-12 |
| 项目配置 | types/project-config.ts | 项目级约束配置 | ✅ | 2026-04-10 |

## 设计原则

| 原则 | 说明 |
|------|------|
| **零 Token 成本** | 所有分析不调用 LLM，纯文件操作 |
| **无业务逻辑** | 只提供能力，业务逻辑在调用方 |
| **文件存储** | 追加写入，单行 JSON，自动滚动 |
| **可扩展规则** | 支持自定义约束、分类规则 |

## 存储路径

```
.harness/
├── logs/
│   ├── traces.log              # 约束检查日志
│   ├── traces-summary.json     # 约束检查汇总
│   ├── performance.log         # 性能监控日志
│   ├── performance-summary.json # 性能汇总
│   └── failures.log            # 失败记录日志
├── diagnoses/                   # 诊断报告
├── proposals/                   # 约束提案
├── config.yml                   # 配置
└── checkpoints.yml              # 检查点
```

## API 使用示例

### 约束检查

```typescript
import { checkConstraints, ConstraintContext } from '@dommaker/harness';

const context: ConstraintContext = {
  trigger: 'task_completion_claim',
  task: { hasTestEvidence: true, verifiedByCI: true },
};

const result = await checkConstraints(context);
// result.ironLaws, result.guidelines, result.tips
```

### Performance Trace

```typescript
import { PerformanceCollector, PerformanceAnalyzer } from '@dommaker/harness';

const collector = new PerformanceCollector({
  logFile: '.harness/logs/performance.log',
  thresholds: { extract: 1000, transform: 500 },
});

await collector.recordOk('extract', 150, { contextSize: 5000 });

const analyzer = new PerformanceAnalyzer();
const summaries = analyzer.summarize(await collector.getHistory());
```

### Failure Classification

```typescript
import { ErrorClassifier, FailureRecorder, ErrorType } from '@dommaker/harness';

const classifier = new ErrorClassifier();
const result = classifier.classify(new Error('test failed'));
// result.type === ErrorType.TEST_FAILED
// result.level === FailureLevel.L1

const recorder = new FailureRecorder({ logFile: '.harness/logs/failures.log' });
await recorder.record({
  type: result.type,
  level: result.level,
  message: 'Test failed',
  timestamp: Date.now(),
});
```

## 变更日志

| 日期 | 变更内容 | 更新者 |
|------|---------|--------|
| 2026-04-17 | **新增 Failure Classification 系统**：ErrorClassifier, FailureRecorder | titi |
| 2026-04-17 | **新增 Performance Trace 系统**：PerformanceCollector, PerformanceAnalyzer | titi |
| 2026-04-16 | **新增 Execution Trace 系统**：TraceCollector, TraceAnalyzer | titi |
| 2026-04-10 | **初始版本**：约束系统 + 门禁系统 + 拦截器 | titi |
