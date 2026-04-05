/**
 * 类型导出
 */

// 约束类型（三层体系）
export * from './constraint';

export * from './checkpoint';
export * from './passes-gate';
export * from './cso';

// Session 类型（排除与 passes-gate 冲突的类型）
export {
  StartupCheckpoints,
  StartupCheckpointType,
  StartupCheckpointResult,
  CleanStateConfig,
  CleanStateResult,
  DetectedBug,
  TaskListJson,
  TaskStepStatus,
  SessionInfo,
} from './session';

// 从 session 导入 DynamicTask，扩展 passes-gate 的定义
export { DynamicTask as ExtendedDynamicTask, TaskTestResult as ExtendedTaskTestResult } from './session';
