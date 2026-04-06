/**
 * 测试门控类型定义
 */

/**
 * 测试门控配置
 */
export interface PassesGateConfig {
  /** 是否启用 */
  enabled?: boolean;
  
  /** 测试命令 */
  testCommand?: string;
  
  /** 是否需要证据 */
  requireEvidence?: boolean;
  
  /** 是否允许部分通过 */
  allowPartialPass?: boolean;
  
  /** 最大重试次数 */
  maxRetries?: number;
  
  /** 重试延迟（毫秒） */
  retryDelay?: number;
}

/**
 * 测试结果
 */
export interface TaskTestResult {
  /** 是否通过 */
  passed: boolean;
  
  /** 测试命令 */
  command: string;
  
  /** 输出 */
  output?: string;
  
  /** 错误 */
  error?: string;
  
  /** 执行时间（毫秒） */
  duration?: number;
  
  /** 时间戳 */
  timestamp?: Date;
  
  /** 失败的测试列表 */
  failures?: string[];
  
  /** 覆盖率 */
  coverage?: number;
  
  /** 证据路径 */
  evidence?: string;
}

/**
 * 测试门控结果
 */
export interface PassesGateResult {
  /** 任务 ID */
  taskId: string;
  
  /** 是否允许设置 */
  allowed: boolean;
  
  /** 测试结果 */
  testResult?: TaskTestResult;
  
  /** 尝试次数 */
  attempts: number;
  
  /** 错误信息 */
  error?: string;
}

/**
 * 动态任务（用于 passes-gate）
 */
export interface DynamicTask {
  /** 任务 ID */
  id: string;
  
  /** 任务名称 */
  name?: string;
  
  /** 是否通过 */
  passes?: boolean;
  
  /** 测试结果 */
  testResult?: TaskTestResult;
}

/**
 * PassesGate 扩展接口
 * 
 * 用于注册额外的测试类型（如 Puppeteer E2E）
 */
export interface PassesGateExtension {
  /** 扩展名称 */
  name: string;
  
  /** 扩展描述 */
  description?: string;
  
  /** 运行测试 */
  run(workDir: string, task?: DynamicTask): Promise<TaskTestResult>;
}

/**
 * 扩展测试结果（包含类型标识）
 */
export interface ExtensionTestResult extends TaskTestResult {
  /** 测试类型（扩展名称） */
  type?: string;
}