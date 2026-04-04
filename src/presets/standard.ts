/**
 * 标准预设
 * 
 * 核心 error 级别铁律启用，warning 可跳过
 */

import type { IronLaw, IronLawConfig } from '../types/iron-law';

export const STANDARD_PRESET: IronLawConfig = {
  preset: 'standard',
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
      id: 'capability_sync',
      rule: 'CODE CHANGES MUST UPDATE CAPABILITIES.MD',
      message: '核心模块变更后必须同步更新功能清单',
      trigger: 'module_modification',
      enforcement: 'update-capabilities',
      severity: 'warning',
      enabled: true,
    },
    {
      id: 'readme_required',
      rule: 'NEW MODULES MUST HAVE README',
      message: '新模块必须创建 README 文档',
      trigger: 'module_creation',
      enforcement: 'create-readme',
      severity: 'info',
      enabled: true,
    },
  ],
};