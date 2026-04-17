/**
 * Performance Trace 类型定义
 *
 * 轻量设计：只记录核心信息，零 Token 成本
 *
 * 与 ExecutionTrace 的区别：
 * - ExecutionTrace: 记录约束检查结果（业务行为）
 * - PerformanceTrace: 记录操作耗时（性能指标）
 */

/**
 * 性能追踪记录
 *
 * 设计原则：
 * - 只记录核心字段（零 Token）
 * - 文件存储，追加写入
 * - 支持多种操作类型
 */
export interface PerformanceTrace {
  // ========================================
  // 核心字段（必须）
  // ========================================

  /** 操作类型 */
  operation: string;

  /** 时间戳（Unix timestamp） */
  timestamp: number;

  /** 耗时（毫秒） */
  duration: number;

  /** 结果 */
  result: 'ok' | 'exceeded' | 'error';

  // ========================================
  // 上下文（可选）
  // ========================================

  /** 阈值（毫秒），用于计算是否超阈值 */
  threshold?: number;

  /** 项目路径（用于区分多项目） */
  projectPath?: string;

  /** 会话 ID（用于追踪同一会话的多次操作） */
  sessionId?: string;

  /** 任务 ID */
  taskId?: string;

  /** 角色ID（用于角色相关操作） */
  roleId?: string;

  /** 额外元数据 */
  metadata?: Record<string, unknown>;
}

/**
 * 性能统计汇总
 */
export interface PerformanceSummary {
  /** 操作类型 */
  operation: string;

  /** 统计时间范围 */
  timeRange: {
    start: number;
    end: number;
  };

  // ========================================
  // 核心统计
  // ========================================

  /** 总执行次数 */
  totalCalls: number;

  /** 成功次数 */
  okCount: number;

  /** 超阈值次数 */
  exceededCount: number;

  /** 错误次数 */
  errorCount: number;

  // ========================================
  // 耗时统计
  // ========================================

  /** 平均耗时（毫秒） */
  avgDuration: number;

  /** 最大耗时 */
  maxDuration: number;

  /** 最小耗时 */
  minDuration: number;

  /** P95 耗时 */
  p95Duration: number;

  /** P99 耗时 */
  p99Duration: number;

  // ========================================
  // 比率统计
  // ========================================

  /** 成功率 (0-1) */
  okRate: number;

  /** 超阈值率 (0-1) */
  exceededRate: number;

  /** 错误率 (0-1) */
  errorRate: number;

  // ========================================
  // 趋势分析
  // ========================================

  /** 最近趋势 */
  recentTrend: 'stable' | 'rising' | 'falling';

  /** 对比上一周期的变化 */
  changeFromLastPeriod?: {
    avgDurationDelta: number;
    exceededRateDelta: number;
  };
}

/**
 * 性能异常
 */
export interface PerformanceAnomaly {
  /** 异常类型 */
  type:
    | 'high_avg_duration'      // 平均耗时过高
    | 'rising_duration'        // 耗时趋势上升
    | 'high_exceeded_rate'     // 超阈值率过高
    | 'rising_exceeded_rate'   // 超阈值率上升
    | 'high_error_rate';       // 错误率过高

  /** 操作类型 */
  operation: string;

  /** 异常描述 */
  message: string;

  /** 相关数据 */
  data: {
    currentValue: number;
    threshold: number;
    trend?: 'rising' | 'falling' | 'stable';
  };

  /** 检测时间 */
  detectedAt: number;

  /** 建议的下一步 */
  suggestedAction?: 'optimize' | 'adjust_threshold' | 'notify_user';
}

/**
 * 性能追踪过滤条件
 */
export interface PerformanceTraceFilter {
  /** 操作类型（可选） */
  operation?: string;

  /** 结果类型（可选） */
  result?: 'ok' | 'exceeded' | 'error';

  /** 时间范围（可选） */
  timeRange?: {
    start: number;
    end: number;
  };

  /** 项目路径（可选） */
  projectPath?: string;

  /** 会话 ID（可选） */
  sessionId?: string;

  /** 任务 ID（可选） */
  taskId?: string;

  /** 角色 ID（可选） */
  roleId?: string;
}

/**
 * PerformanceCollector 配置
 */
export interface PerformanceCollectorConfig {
  /** 日志文件路径，默认 .harness/logs/performance.log */
  logFile?: string;

  /** 最大文件大小（字节），超出则滚动，默认 10MB */
  maxFileSize?: number;

  /** 是否启用（默认 true） */
  enabled?: boolean;
}

/**
 * PerformanceAnalyzer 配置
 */
export interface PerformanceAnalyzerConfig {
  /** Summary 文件路径 */
  summaryFile?: string;

  /** 周期长度（毫秒），默认 1 小时 */
  periodMs?: number;

  /** 异常阈值 */
  thresholds?: {
    /** 平均耗时阈值（毫秒），超过则告警 */
    avgDuration?: number;
    /** 超阈值率阈值，默认 0.3 */
    exceededRate?: number;
    /** 错误率阈值，默认 0.1 */
    errorRate?: number;
  };
}

/**
 * Token 使用记录
 */
export interface TokenUsageRecord {
  /** 时间戳 */
  timestamp: number;

  /** 会话/会议 ID */
  sessionId: string;

  /** 任务 ID（可选） */
  taskId?: string;

  /** 角色 ID（可选） */
  roleId?: string;

  /** 上下文 Token 数 */
  contextTokens: number;

  /** 执行 Token 数 */
  executionTokens: number;

  /** 总 Token 数 */
  totalTokens: number;

  /** 预算 */
  budget: number;

  /** 是否超预算 */
  exceeded: boolean;

  /** 项目路径 */
  projectPath?: string;
}

/**
 * Token 使用统计
 */
export interface TokenUsageSummary {
  /** 会话 ID */
  sessionId: string;

  /** 时间范围 */
  timeRange: {
    start: number;
    end: number;
  };

  /** 总 Token 使用 */
  totalTokens: number;

  /** 平均每次 Token 使用 */
  avgTokensPerCall: number;

  /** 超预算次数 */
  exceededCount: number;

  /** 超预算率 */
  exceededRate: number;

  /** 按任务统计 */
  byTask?: Map<string, number>;

  /** 按角色统计 */
  byRole?: Map<string, number>;
}
