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
 * 单个测试失败信息
 */
export interface TestFailure {
  /** 测试名称 */
  name: string;
  
  /** 失败消息 */
  message: string;
  
  /** 堆栈信息 */
  stack?: string;
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
  
  /** 覆盖率（可选） */
  coverage?: {
    lines?: number;
    branches?: number;
    functions?: number;
    statements?: number;
  };
  
  /** 失败的测试列表 */
  failures?: TestFailure[];
  
  /** 证据（可选） */
  evidence?: {
    type: 'test_output' | 'coverage_report' | 'custom';
    content: string;
  };
}

/**
 * 测试门控结果
 */
export interface PassesGateResult {
  /** 是否通过 */
  passed: boolean;
  
  /** 测试结果列表 */
  testResults: TaskTestResult[];
  
  /** 通过的测试数量 */
  passedTests: number;
  
  /** 失败的测试数量 */
  failedTests: number;
  
  /** 总测试数量 */
  totalTests: number;
  
  /** 执行时间（毫秒） */
  duration: number;
  
  /** 失败的测试列表 */
  failures?: TestFailure[];
  
  /** 证据（可选） */
  evidence?: {
    type: 'test_output' | 'coverage_report' | 'custom';
    content: string;
  };
  
  /** 验证时间 */
  timestamp: number;
  
  /** 消息 */
  message?: string;
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