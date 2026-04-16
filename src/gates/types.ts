/**
 * 门禁类型定义
 */

/**
 * 门禁结果
 */
export interface GateResult {
  gate: string;
  passed: boolean;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
  duration?: number;
}

/**
 * 门禁上下文
 */
export interface GateContext {
  projectId: string;
  taskId?: string;
  projectPath: string;
  
  // Review Gate
  prNumber?: number;
  minReviewers?: number;
  reviewers?: string[];
  
  // Security Gate
  securityScanCommand?: string;
  ignoreWarnings?: boolean;
  
  // Performance Gate
  performanceThresholds?: PerformanceThresholds;
  benchmarkCommand?: string;
  
  // Contract Gate
  oldContractPath?: string;
  newContractPath?: string;
  openApiSpec?: string;
  
  // 通用
  timeout?: number;
}

/**
 * 性能阈值
 */
export interface PerformanceThresholds {
  maxResponseTime?: number;   // ms
  maxMemoryUsage?: number;    // MB
  minCoverage?: number;       // %
  maxBundleSize?: number;     // KB
  minThroughput?: number;     // req/s
}

/**
 * 审查门禁配置
 */
export interface ReviewGateConfig {
  minReviewers: number;
  requireApproval: boolean;
  blockOnChangesRequested: boolean;
  allowedReviewers?: string[];
}

/**
 * 安全门禁配置
 */
export interface SecurityGateConfig {
  enabled: boolean;
  scanCommand?: string;
  ignoreWarnings: boolean;
  ignoreDevDependencies: boolean;
  severityThreshold: 'low' | 'moderate' | 'high' | 'critical';
}

/**
 * 性能门禁配置
 */
export interface PerformanceGateConfig {
  enabled: boolean;
  benchmarkCommand?: string;
  thresholds: PerformanceThresholds;
  warmupRuns: number;
  measureRuns: number;
}

/**
 * 契约门禁配置
 */
export interface ContractGateConfig {
  enabled: boolean;
  strict: boolean;
  allowBreakingChanges: boolean;
  contractPath?: string;
}
