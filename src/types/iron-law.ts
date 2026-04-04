/**
 * 铁律类型定义
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
 * 铁律定义
 */
export interface IronLaw {
  /** 铁律 ID */
  id: IronLawId;
  
  /** 铁律规则描述 */
  rule: string;
  
  /** 违规提示消息 */
  message: string;
  
  /** 严重性 */
  severity: IronLawSeverity;
  
  /** 触发条件（可选） */
  trigger?: IronLawTrigger[];
  
  /** 执行器（可选） */
  enforcement?: string;
  
  /** 是否启用 */
  enabled?: boolean;
}

/**
 * 铁律触发条件
 */
export type IronLawTrigger =
  | 'file_creation'
  | 'file_modification'
  | 'file_deletion'
  | 'module_creation'
  | 'module_modification'
  | 'module_deletion'
  | 'api_change'
  | 'export_change'
  | 'commit'
  | 'push'
  | 'merge';

/**
 * 铁律违规
 */
export interface IronLawViolation {
  /** 违规的铁律 */
  law: IronLaw;
  
  /** 违规消息 */
  message: string;
  
  /** 违规位置（可选） */
  location?: {
    file?: string;
    line?: number;
    column?: number;
  };
  
  /** 违规时间 */
  timestamp: number;
}

/**
 * 铁律检查上下文
 */
export interface IronLawContext {
  /** 项目路径 */
  projectPath: string;
  
  /** 变更的文件列表 */
  changedFiles?: string[];
  
  /** 提交信息（可选） */
  commitMessage?: string;
  
  /** 分支名称（可选） */
  branch?: string;
  
  /** 用户配置（可选） */
  config?: IronLawConfig;
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
}

/**
 * 铁律检查结果
 */
export interface IronLawCheckResult {
  /** 是否通过 */
  passed: boolean;
  
  /** 违规列表 */
  violations: IronLawViolation[];
  
  /** 检查时间 */
  timestamp: number;
}
