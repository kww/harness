/**
 * 检查点类型定义
 */

/**
 * 检查类型
 */
export type CheckType =
  | 'file_exists'
  | 'file_not_empty'
  | 'file_contains'
  | 'command_success'
  | 'custom';

/**
 * 检查配置
 */
export interface CheckpointCheck {
  /** 检查类型 */
  type: CheckType;
  
  /** 检查目标（文件路径、命令等） */
  target?: string;
  
  /** 预期值（用于 contains 检查） */
  expected?: string;
  
  /** 自定义检查函数名 */
  handler?: string;
  
  /** 错误消息 */
  message?: string;
}

/**
 * 检查点配置
 */
export interface Checkpoint {
  /** 检查点 ID */
  id: string;
  
  /** 检查点名称 */
  name?: string;
  
  /** 描述 */
  description?: string;
  
  /** 检查列表 */
  checks: CheckpointCheck[];
  
  /** 是否必须全部通过 */
  requireAll?: boolean;
}

/**
 * 检查结果
 */
export interface CheckResult {
  /** 检查 ID */
  checkId: string;
  
  /** 是否通过 */
  passed: boolean;
  
  /** 消息 */
  message?: string;
  
  /** 错误详情 */
  error?: string;
}

/**
 * 检查点验证结果
 */
export interface CheckpointResult {
  /** 检查点 ID */
  checkpointId: string;
  
  /** 是否全部通过 */
  passed: boolean;
  
  /** 各项检查结果 */
  results: CheckResult[];
  
  /** 通过数量 */
  passedCount: number;
  
  /** 失败数量 */
  failedCount: number;
  
  /** 验证时间 */
  timestamp: number;
}

/**
 * 检查点验证上下文
 */
export interface CheckpointContext {
  /** 项目路径 */
  projectPath: string;
  
  /** 工作目录 */
  workDir?: string;
  
  /** 环境变量 */
  env?: Record<string, string>;
}
