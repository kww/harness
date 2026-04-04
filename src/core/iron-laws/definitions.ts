/**
 * 铁律类型定义
 * 
 * 铁律是 Superpowers 框架中的强制规则，必须在执行关键操作前检查
 */

/**
 * 铁律定义
 */
export interface IronLaw {
  /** 铁律 ID */
  id: string;
  /** 铁律规则（英文） */
  rule: string;
  /** 铁律消息（中文） */
  message: string;
  /** 触发条件 */
  trigger: IronLawTrigger;
  /** 强制执行的技能/步骤 */
  enforcement: string;
  /** 铁律严重级别 */
  severity: 'error' | 'warning' | 'info';
  /** 铁律描述 */
  description?: string;
}

/**
 * 铁律触发条件
 */
export type IronLawTrigger =
  | 'bug_fix_attempt'         // 尝试修复 bug
  | 'task_completion_claim'   // 声明任务完成
  | 'skill_creation'          // 创建新技能
  | 'code_implementation'     // 编写实现代码
  | 'workflow_execution'      // 执行工作流
  | 'step_execution'          // 执行步骤
  | 'step_creation'           // 创建新步骤
  | 'tool_creation'           // 创建新工具
  | 'workflow_creation'       // 创建新工作流
  | 'module_creation'         // 创建新模块
  | 'module_modification'     // 修改核心模块
  | 'module_deletion'         // 删除模块
  | 'api_change'              // API 变更
  | 'export_change';          // 导出变更

/**
 * 铁律检查结果
 */
export interface IronLawResult {
  /** 是否满足铁律 */
  satisfied: boolean;
  /** 铁律定义 */
  law?: IronLaw;
  /** 错误消息 */
  message?: string;
  /** 建议操作 */
  requiredAction?: string;
  /** 检查时间 */
  checkedAt: Date;
}

/**
 * 铁律检查上下文
 */
export interface IronLawContext {
  /** 当前操作类型 */
  operation: IronLawTrigger;
  /** 工作流 ID */
  workflowId?: string;
  /** 步骤 ID */
  stepId?: string;
  /** 任务描述 */
  taskDescription?: string;
  /** 是否有根本原因调查 */
  hasRootCauseInvestigation?: boolean;
  /** 是否有验证证据 */
  hasVerificationEvidence?: boolean;
  /** 是否有测试 */
  hasTest?: boolean;
  /** 是否有失败的测试 */
  hasFailingTest?: boolean;
  /** 是否已进行复用检查 */
  hasReuseCheck?: boolean;
  /** 复用检查结果 */
  reuseCheckResult?: {
    existingCapabilities: string[];
    canReuse: boolean;
    reuseRecommendation: string;
  };
  /** 执行上下文 */
  executionContext?: any;
}

/**
 * 铁律违规错误
 */
export class IronLawViolationError extends Error {
  public readonly result: IronLawResult;

  constructor(result: IronLawResult) {
    super(result.message || 'Iron law violation');
    this.name = 'IronLawViolationError';
    this.result = result;
  }
}

/**
 * 所有铁律定义
 */
export const IRON_LAWS: Record<string, IronLaw> = {
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

  capability_sync: {
    id: 'capability_sync',
    rule: 'CODE CHANGES MUST UPDATE CAPABILITIES.MD',
    message: '核心模块变更后必须同步更新功能清单 (CAPABILITIES.md)',
    trigger: 'module_creation',
    enforcement: 'update-capabilities',
    severity: 'warning',
    description: '在创建、修改或删除核心模块时，必须同步更新 CAPABILITIES.md，确保功能清单与代码一致',
  },
};
