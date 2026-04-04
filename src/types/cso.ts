/**
 * CSO (Concise Skill Optimization) 类型定义
 */

/**
 * Workflow 元数据
 */
export interface WorkflowMeta {
  /** 工作流名称 */
  name: string;
  /** 工作流描述 */
  description: string;
  /** 工作流步骤 */
  steps?: StepMeta[];
}

/**
 * Step 元数据
 */
export interface StepMeta {
  /** 步骤名称 */
  name: string;
  /** 步骤描述 */
  description: string;
  /** 步骤工具 */
  tools?: ToolMeta[];
}

/**
 * Tool 元数据
 */
export interface ToolMeta {
  /** 工具名称 */
  name: string;
  /** 工具描述 */
  description: string;
}
