/**
 * 铁律定义
 * 
 * 所有内置的铁律规则
 */

import type { IronLaw, IronLawTrigger, IronLawViolationError as IronLawViolationErrorClass } from '../../types/iron-law';

// 导出 IronLawViolationError 类
export { IronLawViolationError } from '../../types/iron-law';

/**
 * 所有铁律定义
 */
export const IRON_LAWS: Record<string, IronLaw> = {
  // ========================================
  // 开发铁律（约束 AI 行为）
  // ========================================
  
  no_simplification_without_approval: {
    id: 'no_simplification_without_approval',
    rule: 'NO SIMPLIFYING LOGIC WITHOUT USER APPROVAL',
    message: '不能为了赶进度/省事而砍功能，合理重构优化除外',
    trigger: 'code_implementation',
    enforcement: 'preserve-complexity',
    severity: 'error',
    description: `在实现或修改代码时，区分简化类型：

[禁止] 必须向用户说明并获取批准：
- 为了赶进度砍掉必要功能
- 为了省事跳过边界条件处理
- 为了简化逻辑牺牲用户体验
- 降低质量标准绕过困难

[允许] 合理优化，不需要批准：
- 发现冗余代码后的重构优化
- 用更简洁的实现达到相同效果
- 删除不再使用的遗留代码
- 提取公共逻辑减少重复

[需说明] 不需要批准但需记录：
- 因技术债务需要临时简化
- 因时间压力需要延期实现

与 no_test_simplification 的边界：
- 本铁律：代码逻辑简化
- no_test_simplification：测试用例简化`,
    exceptions: ['redundant_code_cleanup', 'same_effect_refactor', 'unused_code_removal'],
  },

  // ========================================
  // 核心铁律（来自 Superpowers 框架）
  // ========================================
  
  no_fix_without_root_cause: {
    id: 'no_fix_without_root_cause',
    rule: 'NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST',
    message: '复杂 bug 必须先调查根本原因，简单 bug 仍需说明原因',
    trigger: 'bug_fix_attempt',
    enforcement: 'debug-systematic',
    severity: 'error',
    description: `在尝试修复 bug 之前，按复杂度区分调查要求：

[复杂 bug - 必须系统性调查]
- 业务逻辑错误（需追踪数据流）
- 状态不一致（需分析状态变化链）
- 性能问题（需定位瓶颈）
- 多模块联动问题（需分析调用链）

[简单 bug - 快速确认即可，但仍需说明]
- typo/拼写错误（确认位置即可）
- 配置值错误（确认正确值即可）
- 缺少必要配置（确认需要什么即可）

[禁止]
- 没有任何调查就直接猜测修复
- 看到 error 就直接 try-catch 掩盖
- 没有确认原因就复制粘贴类似代码`,
    exceptions: ['simple_typo', 'config_value_error', 'missing_config'],
  },

  no_completion_without_verification: {
    id: 'no_completion_without_verification',
    rule: 'NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE',
    message: '在声明任务完成之前，必须运行验证命令',
    trigger: 'task_completion_claim',
    enforcement: 'verify-completion',
    severity: 'error',
    description: '在声明任何任务完成之前，必须运行新鲜的、完整的验证命令',
  },

  no_skill_without_test: {
    id: 'no_skill_without_test',
    rule: 'NO SKILL WITHOUT A FAILING TEST FIRST',
    message: '在创建新技能之前，必须先创建压力场景测试',
    trigger: 'skill_creation',
    enforcement: 'skill-test-scenario',
    severity: 'warning',
    description: '在创建新的 agent 技能之前，必须先定义压力场景测试',
  },

  no_code_without_test: {
    id: 'no_code_without_test',
    rule: 'PRODUCTION LOGIC CODE MUST HAVE TESTS FIRST',
    message: '业务逻辑代码必须先写测试，配置/类型定义等除外',
    trigger: 'code_implementation',
    enforcement: 'tdd-cycle',
    severity: 'error',
    description: `在编写代码时，按类型区分测试要求：

[必须先写测试]
- 业务逻辑代码（算法、计算、数据处理）
- 工具函数（可复用的独立函数）
- API 接口（输入输出验证）
- 核心组件（影响系统行为的组件）

[不强制测试] 但仍建议有
- 配置文件（config、env）
- 类型定义文件（.d.ts、interface）
- 简单 getter/setter
- 纯展示 UI 组件（无交互逻辑）

[禁止]
- 业务逻辑代码直接实现，没有任何测试`,
    exceptions: ['config_file', 'type_definition', 'simple_accessor', 'pure_display_component'],
  },

  no_creation_without_reuse_check: {
    id: 'no_creation_without_reuse_check',
    rule: 'NO NEW CAPABILITIES WITHOUT REUSE CHECK FIRST',
    message: '在创建新能力之前，必须先检查是否有可复用的现有能力',
    trigger: [
      'step_creation',
      'tool_creation',
      'workflow_creation',
      'module_creation',
      'module_extension',
      'feature_development',
    ],
    enforcement: 'reuse-first',
    severity: 'warning',
    description: '在创建新能力（step/tool/workflow/module）或实现新功能之前，必须先执行复用检查，避免重复造轮子',
  },

  // ========================================
  // 功能清单铁律
  // ========================================
  
  capability_sync: {
    id: 'capability_sync',
    rule: 'CODE CHANGES MUST UPDATE CAPABILITIES.MD',
    message: '核心模块变更后必须同步更新功能清单 (CAPABILITIES.md)',
    trigger: ['module_creation', 'module_modification', 'module_deletion', 'module_extension'],
    enforcement: 'update-capabilities',
    severity: 'warning',
    description: `在创建/修改/删除/扩展核心模块时，必须同步更新 CAPABILITIES.md：

[必须更新]
- 新增模块/功能
- 修改模块对外接口
- 删除模块/功能
- 扩展模块能力

[不强制更新] 但仍建议记录
- 内部重构不影响对外接口
- bug fix 不改变功能
- 性能优化不改变接口
- 代码格式/注释修改

CAPABILITIES.md 作用：
- 项目能力清单的唯一来源
- 防止功能丢失/遗忘
- 新成员快速了解项目`,
    exceptions: ['internal_refactor', 'bug_fix_only', 'performance_optimization'],
  },

  // ========================================
  // 代码质量铁律
  // ========================================
  
  no_any_type: {
    id: 'no_any_type',
    rule: 'AVOID ANY TYPE, USE UNKNOWN OR SPECIFIC TYPES',
    message: '避免 any 类型，使用 unknown 或具体类型。特殊情况需说明。',
    trigger: 'code_implementation',
    enforcement: 'type-safe',
    severity: 'warning',
    description: `TypeScript 代码中应避免使用 any 类型：

[推荐做法]
- 使用 unknown + 类型守卫
- 使用具体类型定义
- 使用泛型约束

[允许例外] 但需添加注释说明
- JSON.parse/JSON.stringify 结果（应尽快验证类型）
- 第三方库无类型定义（应添加 @types 或自定义类型）
- 迁移遗留代码临时使用（应在 TODO 中标记）

[禁止]
- 业务逻辑中使用 any 掩盖类型问题
- 函数参数/返回值使用 any
- 为绕过类型检查故意使用 any`,
    exceptions: ['json_parse_result', 'third_party_no_types', 'legacy_migration'],
  },

  no_bypass_checkpoint: {
    id: 'no_bypass_checkpoint',
    rule: 'NO BYPASSING CHECKPOINTS',
    message: '禁止跳过检查点验证',
    trigger: 'step_execution',
    enforcement: 'checkpoint-required',
    severity: 'error',
    description: '所有检查点必须通过，不能跳过验证步骤',
  },

  // ========================================
  // 测试铁律
  // ========================================
  
  no_test_simplification: {
    id: 'no_test_simplification',
    rule: 'NO SIMPLIFYING TESTS TO AVOID DIFFICULTY',
    message: '禁止为了绕过困难而简化测试，遇到测试问题必须解决或向用户说明',
    trigger: 'test_creation',
    enforcement: 'full-test-coverage',
    severity: 'error',
    description: '在编写测试时，不能因为遇到困难（如 mock 问题、异步问题）而简化或跳过测试。必须完整实现测试，或向用户说明困难并请求指示',
  },

  test_coverage_required: {
    id: 'test_coverage_required',
    rule: 'TEST COVERAGE MUST MEET REQUIREMENTS',
    message: '测试覆盖率必须达到要求',
    trigger: 'task_completion_claim',
    enforcement: 'check-coverage',
    severity: 'warning',
    description: '在提交代码前，测试覆盖率必须达到项目要求（默认 80%）',
  },

  no_self_approval: {
    id: 'no_self_approval',
    rule: 'NO SELF APPROVAL WITHOUT TEST EVIDENCE',
    message: '禁止自评通过，必须提供测试证据',
    trigger: 'task_completion_claim',
    enforcement: 'passes-gate',
    severity: 'error',
    description: '任务完成声明必须基于真实测试结果，不能由开发者自评',
  },

  // ========================================
  // 设计铁律（避免过度设计）
  // ========================================

  simplest_solution_first: {
    id: 'simplest_solution_first',
    rule: 'CHECK LOCAL/SIMPLE OPTIONS BEFORE REMOTE/COMPLEX',
    message: '先检查本地/简单方案，再考虑远程/复杂方案。如有例外需求需说明理由。',
    trigger: ['feature_development', 'module_extension', 'code_implementation'],
    enforcement: 'check-local-first',
    severity: 'warning',
    description: `在实现功能时，必须按顺序检查：
1) 是否有本地数据源（内存/文件）？
2) 是否有更简单的方案（更少依赖/更少代码）？
3) 如需远程查询/复杂架构，必须说明理由。

例外情况（可跳过简单方案）：
- scalability_required: 需要多实例/分布式部署
- security_required: 需要加密/鉴权等安全措施
- performance_required: 本地方案性能不足
- reliability_required: 需要持久化/高可用`,
    exceptions: ['scalability_required', 'security_required', 'performance_required', 'reliability_required'],
  },

  // ========================================
  // 文档铁律
  // ========================================
  
  doc_required_for_public_api: {
    id: 'doc_required_for_public_api',
    rule: 'PUBLIC API MUST HAVE DOCUMENTATION',
    message: '公共 API 必须有文档注释',
    trigger: 'export_change',
    enforcement: 'add-docs',
    severity: 'warning',
    description: '所有导出的函数、类、接口必须有 JSDoc 注释说明用途和参数',
  },

  readme_required: {
    id: 'readme_required',
    rule: 'NEW MODULES MUST HAVE README',
    message: '新模块必须创建 README 文档',
    trigger: 'module_creation',
    enforcement: 'create-readme',
    severity: 'info',
    description: '创建新模块时应同时创建 README.md 说明模块用途和使用方法',
  },
};

/**
 * 根据触发条件查找适用的铁律
 */
export function findLawsByTrigger(trigger: IronLawTrigger): IronLaw[] {
  return Object.values(IRON_LAWS).filter(law => law.trigger === trigger);
}

/**
 * 获取所有铁律
 */
export function getAllLaws(): IronLaw[] {
  return Object.values(IRON_LAWS);
}

/**
 * 获取单个铁律
 */
export function getLaw(id: string): IronLaw | undefined {
  return IRON_LAWS[id];
}

/**
 * 根据严重性过滤铁律
 */
export function filterLawsBySeverity(severity: 'error' | 'warning' | 'info'): IronLaw[] {
  return Object.values(IRON_LAWS).filter(law => law.severity === severity);
}