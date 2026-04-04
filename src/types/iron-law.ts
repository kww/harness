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
  
  /** 触发条件 */
  trigger: IronLawTrigger;
  
  /** 强制执行的技能/步骤 */
  enforcement: string;
  
  /** 铁律严重级别 */
  severity: IronLawSeverity;
  
  /** 铁律描述 */
  description?: string;
  
  /** 是否启用 */
  enabled?: boolean;
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
