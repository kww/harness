/**
 * 严格预设
 * 
 * 所有铁律都启用，error 级别不可跳过
 */

import type { IronLaw, IronLawConfig } from '../types/iron-law';

export const STRICT_PRESET: IronLawConfig = {
  preset: 'strict',
  enabled: true,
  ironLaws: [
    {
      id: 'no_fix_without_root_cause',
      rule: 'NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST',
      message: '在修复问题之前，必须先进行根本原因调查',
      trigger: 'bug_fix_attempt',
      enforcement: 'debug-systematic',
      severity: 'error',
      enabled: true,
    },
    {
      id: 'no_completion_without_verification',
      rule: 'NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE',
      message: '在声明任务完成之前，必须运行验证命令',
      trigger: 'task_completion_claim',
      enforcement: 'verify-completion',
      severity: 'error',
      enabled: true,
    },
    {
      id: 'no_code_without_test',
      rule: 'NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST',
      message: '在编写实现代码之前，必须先写失败的测试',
      trigger: 'code_implementation',
      enforcement: 'tdd-cycle',
      severity: 'error',
      enabled: true,
    },
    {
      id: 'capability_sync',
      rule: 'CODE CHANGES MUST UPDATE CAPABILITIES.MD',
      message: '核心模块变更后必须同步更新功能清单',
      trigger: 'module_modification',
      enforcement: 'update-capabilities',
      severity: 'error',
      enabled: true,
    },
  ],
};