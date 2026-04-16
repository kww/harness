/**
 * 验收标准门禁
 * 
 * 功能：
 * 1. 验证任务是否满足验收标准
 * 2. 解析 tasks.yml 中的验收条件
 * 3. 检查所有验收条件是否满足
 * 
 * 使用示例：
 * ```typescript
 * const gate = new SpecAcceptanceGate();
 * const result = await gate.check({
 *   taskId: 'task-001',
 *   tasksPath: './tasks.yml',
 * });
 * ```
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as yaml from 'js-yaml';

/**
 * 验收标准门禁配置
 */
export interface SpecAcceptanceGateConfig {
  /** tasks.yml 路径 */
  tasksPath?: string;
  /** 是否检查所有任务 */
  checkAllTasks?: boolean;
  /** 自定义验收条件 */
  customAcceptanceCriteria?: Record<string, (task: any) => Promise<boolean>>;
}

/**
 * 验收标准门禁上下文
 */
export interface AcceptanceGateContext {
  /** 项目路径 */
  projectPath: string;
  /** 任务 ID */
  taskId?: string;
  /** tasks.yml 路径 */
  tasksPath?: string;
}

/**
 * 验收标准
 */
export interface AcceptanceCriteria {
  id: string;
  description: string;
  type: 'manual' | 'automated' | 'test';
  required: boolean;
  checked?: boolean;
  notes?: string;
}

/**
 * 任务定义
 */
export interface TaskDefinition {
  id: string;
  title: string;
  description?: string;
  acceptance_criteria?: AcceptanceCriteria[];
  status?: string;
  completed?: boolean;
}

/**
 * Tasks 文件结构
 */
export interface TasksFile {
  tasks: TaskDefinition[];
  version?: string;
}

/**
 * 验收门禁结果
 */
export interface AcceptanceGateResult {
  passed: boolean;
  message: string;
  timestamp: string;
  details?: {
    taskId?: string;
    totalCriteria: number;
    checkedCriteria: number;
    uncheckedCriteria: string[];
    missingCriteria: string[];
  };
}

/**
 * 验收标准门禁
 */
export class SpecAcceptanceGate {
  private config: SpecAcceptanceGateConfig;

  constructor(config?: Partial<SpecAcceptanceGateConfig>) {
    this.config = {
      tasksPath: './tasks.yml',
      checkAllTasks: false,
      ...config,
    };
  }

  /**
   * 检查验收标准
   */
  async check(context: AcceptanceGateContext): Promise<AcceptanceGateResult> {
    const startTime = Date.now();

    try {
      // 确定 tasks.yml 路径
      const tasksPath = context.tasksPath ?? 
        this.config.tasksPath ?? 
        path.join(context.projectPath, 'tasks.yml');

      // 加载 tasks 文件
      const tasks = await this.loadTasks(tasksPath);

      if (!tasks || !tasks.tasks || tasks.tasks.length === 0) {
        return {
          passed: true,
          message: 'No tasks.yml found or no tasks defined, skipping',
          timestamp: new Date().toISOString(),
        };
      }

      // 检查特定任务或所有任务
      if (context.taskId) {
        return this.checkSingleTask(tasks, context.taskId);
      } else if (this.config.checkAllTasks) {
        return this.checkAllTasks(tasks);
      } else {
        // 默认只检查已完成任务
        return this.checkCompletedTasks(tasks);
      }
    } catch (error: any) {
      return {
        passed: false,
        message: `Acceptance gate error: ${error.message}`,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * 加载 tasks.yml
   */
  private async loadTasks(tasksPath: string): Promise<TasksFile | null> {
    try {
      const content = await fs.readFile(tasksPath, 'utf-8');
      return yaml.load(content) as TasksFile;
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }

  /**
   * 检查单个任务
   */
  private checkSingleTask(tasks: TasksFile, taskId: string): AcceptanceGateResult {
    const task = tasks.tasks.find(t => t.id === taskId);

    if (!task) {
      return {
        passed: false,
        message: `Task not found: ${taskId}`,
        timestamp: new Date().toISOString(),
      };
    }

    return this.validateTask(task);
  }

  /**
   * 检查所有任务
   */
  private checkAllTasks(tasks: TasksFile): AcceptanceGateResult {
    const results: AcceptanceGateResult[] = [];

    for (const task of tasks.tasks) {
      results.push(this.validateTask(task));
    }

    const failedTasks = results.filter(r => !r.passed);

    if (failedTasks.length === 0) {
      return {
        passed: true,
        message: 'All tasks pass acceptance criteria',
        timestamp: new Date().toISOString(),
        details: {
          totalCriteria: results.length,
          checkedCriteria: results.length,
          uncheckedCriteria: [],
          missingCriteria: [],
        },
      };
    }

    return {
      passed: false,
      message: `${failedTasks.length} task(s) fail acceptance criteria`,
      timestamp: new Date().toISOString(),
      details: {
        totalCriteria: results.length,
        checkedCriteria: results.length - failedTasks.length,
        uncheckedCriteria: failedTasks.map(r => r.message),
        missingCriteria: [],
      },
    };
  }

  /**
   * 检查已完成的任务
   */
  private checkCompletedTasks(tasks: TasksFile): AcceptanceGateResult {
    const completedTasks = tasks.tasks.filter(t => t.completed || t.status === 'done');

    if (completedTasks.length === 0) {
      return {
        passed: true,
        message: 'No completed tasks to check',
        timestamp: new Date().toISOString(),
      };
    }

    const results: AcceptanceGateResult[] = [];
    for (const task of completedTasks) {
      results.push(this.validateTask(task));
    }

    const failedTasks = results.filter(r => !r.passed);

    if (failedTasks.length === 0) {
      return {
        passed: true,
        message: 'All completed tasks pass acceptance criteria',
        timestamp: new Date().toISOString(),
      };
    }

    return {
      passed: false,
      message: `${failedTasks.length} completed task(s) fail acceptance criteria`,
      timestamp: new Date().toISOString(),
      details: {
        totalCriteria: results.length,
        checkedCriteria: results.length - failedTasks.length,
        uncheckedCriteria: failedTasks.map(r => r.message),
        missingCriteria: [],
      },
    };
  }

  /**
   * 验证任务
   */
  private validateTask(task: TaskDefinition): AcceptanceGateResult {
    // 没有验收标准，默认通过
    if (!task.acceptance_criteria || task.acceptance_criteria.length === 0) {
      return {
        passed: true,
        message: `Task ${task.id} has no acceptance criteria`,
        timestamp: new Date().toISOString(),
      };
    }

    const unchecked: string[] = [];
    const missing: string[] = [];

    for (const criteria of task.acceptance_criteria) {
      // 必须的验收条件未检查
      if (criteria.required && !criteria.checked) {
        unchecked.push(criteria.id);
      }
    }

    if (unchecked.length === 0) {
      return {
        passed: true,
        message: `Task ${task.id} passes all acceptance criteria`,
        timestamp: new Date().toISOString(),
        details: {
          taskId: task.id,
          totalCriteria: task.acceptance_criteria.length,
          checkedCriteria: task.acceptance_criteria.filter(c => c.checked).length,
          uncheckedCriteria: [],
          missingCriteria: [],
        },
      };
    }

    return {
      passed: false,
      message: `Task ${task.id} has ${unchecked.length} unchecked acceptance criteria`,
      timestamp: new Date().toISOString(),
      details: {
        taskId: task.id,
        totalCriteria: task.acceptance_criteria.length,
        checkedCriteria: task.acceptance_criteria.filter(c => c.checked).length,
        uncheckedCriteria: unchecked,
        missingCriteria: [],
      },
    };
  }
}

/**
 * 创建验收标准门禁（便捷函数）
 */
export function createSpecAcceptanceGate(config?: Partial<SpecAcceptanceGateConfig>): SpecAcceptanceGate {
  return new SpecAcceptanceGate(config);
}
