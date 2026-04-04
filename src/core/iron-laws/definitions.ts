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
    message: '不能为了快速完成任务而自行简化逻辑',
    trigger: 'code_implementation',
    enforcement: 'preserve-complexity',
    severity: 'error',
    description: '在实现或修改代码时，遇到复杂度问题应该向用户说明并请求指示，而不是自行简化逻辑导致功能缺失',
  },

  // ========================================
  // 核心铁律（来自 Superpowers 框架）
  // ========================================
  
  no_fix_without_root_cause: {
    id: 'no_fix_without_root_cause',
    rule: 'NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST',
    message: '在修复问题之前，必须先进行根本原因调查',
    trigger: 'bug_fix_attempt',
    enforcement: 'debug-systematic',
    severity: 'error',
    description: '在尝试修复 bug 或错误之前，必须先进行系统性的根本原因调查',
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
    rule: 'NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST',
    message: '在编写实现代码之前，必须先写失败的测试',
    trigger: 'code_implementation',
    enforcement: 'tdd-cycle',
    severity: 'error',
    description: '在编写生产代码之前，必须先编写失败的测试',
  },

  no_creation_without_reuse_check: {
    id: 'no_creation_without_reuse_check',
    rule: 'NO NEW CAPABILITIES WITHOUT REUSE CHECK FIRST',
    message: '在创建新能力之前，必须先检查是否有可复用的现有能力',
    trigger: 'step_creation',
    enforcement: 'reuse-first',
    severity: 'warning',
    description: '在创建新的 step/tool/workflow 之前，必须先执行复用检查，避免重复造轮子',
  },

  // ========================================
  // 功能清单铁律
  // ========================================
  
  capability_sync: {
    id: 'capability_sync',
    rule: 'CODE CHANGES MUST UPDATE CAPABILITIES.MD',
    message: '核心模块变更后必须同步更新功能清单 (CAPABILITIES.md)',
    trigger: 'module_modification',
    enforcement: 'update-capabilities',
    severity: 'warning',
    description: '在创建、修改或删除核心模块时，必须同步更新 CAPABILITIES.md，确保功能清单与代码一致',
  },

  // ========================================
  // 代码质量铁律
  // ========================================
  
  no_any_type: {
    id: 'no_any_type',
    rule: 'NO ANY TYPE IN TYPESCRIPT CODE',
    message: '禁止在 TypeScript 代码中使用 any 类型',
    trigger: 'code_implementation',
    enforcement: 'type-safe',
    severity: 'warning',
    description: 'TypeScript 代码中应避免使用 any 类型，使用 unknown 或具体类型代替',
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
