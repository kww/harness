/**
 * Long-Running Agents 类型定义
 * 
 * 来源：Anthropic Engineering Blog - Effective Harnesses for Long-Running Agents
 * 参考：~/knowledge-base/projects/harness/anthropic-long-running-agents-roadmap.md
 */

/**
 * 功能定义
 * 
 * 用于 feature_list.json，记录项目级功能清单
 */
export interface FeatureDefinition {
  /** 功能 ID */
  id: string;
  
  /** 功能分类 */
  category: 'functional' | 'ui' | 'performance' | 'security';
  
  /** 功能描述 */
  description: string;
  
  /** 测试步骤 */
  steps: string[];
  
  /** 是否通过 */
  passes: boolean;
  
  /** 优先级 */
  priority: 'high' | 'medium' | 'low';
  
  /** 依赖的其他功能 ID */
  dependencies: string[];
  
  /** 完成时间 */
  completedAt?: string;
  
  /** 完成的 session ID */
  completedBy?: string;
  
  /** 验证类型 */
  verificationType: 'unit' | 'e2e' | 'manual';
}

/**
 * 功能清单
 */
export interface FeatureList {
  /** 项目 ID */
  projectId: string;
  
  /** 项目名称 */
  projectName: string;
  
  /** 功能列表 */
  features: FeatureDefinition[];
  
  /** 创建时间 */
  createdAt: string;
  
  /** 更新时间 */
  updatedAt: string;
}

/**
 * 项目级进度
 * 
 * 用于 claude-progress.json，跨 session 共享进度
 */
export interface ProjectProgress {
  /** 项目 ID */
  projectId: string;
  
  /** 功能状态列表 */
  features: FeatureStatus[];
  
  /** Session 记录列表 */
  sessions: SessionRecord[];
  
  /** 最后更新时间 */
  lastUpdate: string;
}

/**
 * 功能状态
 */
export interface FeatureStatus {
  /** 功能 ID */
  featureId: string;
  
  /** 状态 */
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  
  /** 开始时间 */
  startedAt?: string;
  
  /** 完成时间 */
  completedAt?: string;
  
  /** 完成的 session 编号 */
  completedBySession?: number;
}

/**
 * Session 记录
 */
export interface SessionRecord {
  /** Session 编号 */
  sessionId: number;
  
  /** 开始时间 */
  startTime: string;
  
  /** 结束时间 */
  endTime: string;
  
  /** 工作的功能 ID */
  featureWorkedOn: string;
  
  /** 结果 */
  outcome: 'progress' | 'completed' | 'blocked' | 'failed';
  
  /** 提交 hash 列表 */
  commits: string[];
  
  /** 进度说明 */
  notes: string;
}

/**
 * 测试步骤
 * 
 * 用于 Puppeteer E2E 测试
 */
export interface TestStep {
  /** 动作类型 */
  action: 'navigate' | 'click' | 'type' | 'wait' | 'verify';
  
  /** 步骤描述 */
  description: string;
  
  /** CSS 选择器 */
  selector?: string;
  
  /** URL */
  url?: string;
  
  /** 输入值 */
  value?: string;
  
  /** 期望值（用于 verify） */
  expectedValue?: string;
  
  /** 超时时间（毫秒） */
  timeout?: number;
}

/**
 * 步骤结果
 */
export interface StepResult {
  /** 是否通过 */
  passed: boolean;
  
  /** 步骤描述 */
  description: string;
  
  /** 错误信息 */
  error?: string;
}

/**
 * Puppeteer 测试输入
 */
export interface PuppeteerTestInput {
  /** 功能定义 */
  feature: FeatureDefinition;
  
  /** 测试基础 URL */
  baseUrl: string;
  
  /** 自定义测试步骤（可选） */
  steps?: TestStep[];
}

/**
 * Puppeteer 测试结果
 */
export interface PuppeteerTestResult {
  /** 是否通过 */
  passed: boolean;
  
  /** 每个步骤的结果 */
  results: StepResult[];
  
  /** 失败的步骤 */
  failedStep?: string;
  
  /** 截图（base64） */
  screenshot?: string;
}