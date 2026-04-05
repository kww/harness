/**
 * 铁律类型定义
 * 
 * 铁律是工程约束框架中的强制规则，必须在执行关键操作前检查
 */

/**
 * 铁律 ID
 */
export type IronLawId = string;

/**
 * 铁律严重性
 */
export type IronLawSeverity = 'error' | 'warning' | 'info';

/**
 * 铁律触发条件
 */
export type IronLawTrigger =
  | 'bug_fix_attempt'         // 尝试修复 bug
  | 'task_completion_claim'   // 声明任务完成
  | 'skill_creation'          // 创建新技能
  | 'code_implementation'     // 编写实现代码
  | 'test_creation'           // 创建测试
  | 'workflow_execution'      // 执行工作流
  | 'step_execution'          // 执行步骤
  | 'step_creation'           // 创建新步骤
  | 'tool_creation'           // 创建新工具
  | 'workflow_creation'       // 创建新工作流
  | 'module_creation'         // 创建新模块
  | 'module_modification'     // 修改核心模块
  | 'module_deletion'         // 删除模块
  | 'module_extension'        // 扩展现有模块
  | 'feature_development'     // 实现新功能
  | 'api_change'              // API 变更
  | 'export_change'           // 导出变更
  | 'file_creation'           // 创建文件
  | 'file_modification'       // 修改文件
  | 'file_deletion'           // 删除文件
  | 'commit'                  // 提交代码
  | 'push'                    // 推送代码
  | 'merge';                  // 合并代码

/**
 * 铁律定义
 */
export interface IronLaw {
  /** 铁律 ID */
  id: IronLawId;
  
  /** 铁律规则（英文） */
  rule: string;
  
  /** 铁律消息（中文） */
  message: string;
  
  /** 触发条件（支持多个 trigger） */
  trigger: IronLawTrigger | IronLawTrigger[];
  
  /** 强制执行的技能/步骤 */
  enforcement: string;
  
  /** 铁律严重级别 */
  severity: IronLawSeverity;
  
  /** 铁律描述 */
  description?: string;
  
  /** 是否启用 */
  enabled?: boolean;
  
  /** 例外条件（满足这些条件可跳过铁律） */
  exceptions?: string[];
}

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
  
  /** 项目路径 */
  projectPath?: string;
  
  /** 变更的文件列表 */
  changedFiles?: string[];
  
  /** 提交信息 */
  commitMessage?: string;
  
  /** 分支名称 */
  branch?: string;
  
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
  
  // ========================================
  // 例外条件（用于跳过铁律）
  // ========================================
  
  // simplest_solution_first 例外
  /** 需要多实例/分布式部署（例外：scalability_required） */
  scalabilityRequired?: boolean;
  
  /** 需要加密/鉴权等安全措施（例外：security_required） */
  securityRequired?: boolean;
  
  /** 本地方案性能不足（例外：performance_required） */
  performanceRequired?: boolean;
  
  /** 需要持久化/高可用（例外：reliability_required） */
  reliabilityRequired?: boolean;
  
  // no_fix_without_root_cause 例外
  /** 简单拼写错误（例外：simple_typo） */
  isSimpleTypo?: boolean;
  
  /** 配置值错误（例外：config_value_error） */
  isConfigValueError?: boolean;
  
  /** 缺少必要配置（例外：missing_config） */
  isMissingConfig?: boolean;
  
  // no_code_without_test 例外
  /** 配置文件（例外：config_file） */
  isConfigFile?: boolean;
  
  /** 类型定义文件（例外：type_definition） */
  isTypeDefinition?: boolean;
  
  /** 简单 getter/setter（例外：simple_accessor） */
  isSimpleAccessor?: boolean;
  
  /** 纯展示 UI 组件（例外：pure_display_component） */
  isPureDisplayComponent?: boolean;
  
  // no_any_type 例外
  /** JSON.parse 结果（例外：json_parse_result） */
  isJsonParseResult?: boolean;
  
  /** 第三方库无类型（例外：third_party_no_types） */
  isThirdPartyNoTypes?: boolean;
  
  /** 遗留代码迁移（例外：legacy_migration） */
  isLegacyMigration?: boolean;
  
  // capability_sync 例外
  /** 内部重构不影响接口（例外：internal_refactor） */
  isInternalRefactor?: boolean;
  
  /** 仅 bug fix 不改变功能（例外：bug_fix_only） */
  isBugFixOnly?: boolean;
  
  /** 性能优化不改变接口（例外：performance_optimization） */
  isPerformanceOptimization?: boolean;
  
  // no_simplification_without_approval 例外
  /** 冗余代码清理（例外：redundant_code_cleanup） */
  isRedundantCodeCleanup?: boolean;
  
  /** 相同效果重构（例外：same_effect_refactor） */
  isSameEffectRefactor?: boolean;
  
  /** 未使用代码删除（例外：unused_code_removal） */
  isUnusedCodeRemoval?: boolean;
  
  /** 例外理由说明（可选） */
  exceptionReason?: string;
  
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
 * 铁律配置
 */
export interface IronLawConfig {
  /** 铁律列表 */
  ironLaws: IronLaw[];
  
  /** 预设名称 */
  preset?: 'strict' | 'standard' | 'relaxed';
  
  /** 是否启用 */
  enabled?: boolean;
  
  /** 配置文件路径 */
  configPath?: string;
}
