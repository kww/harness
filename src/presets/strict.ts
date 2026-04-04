/**
 * 严格预设
 */

import type { IronLawConfig } from '../types';

export const STRICT_PRESET: IronLawConfig = {
  preset: 'strict',
  enabled: true,
  ironLaws: [
    {
      id: 'no_self_approval',
      rule: '禁止自评通过',
      message: '任务必须通过测试验证，不能自评完成',
      severity: 'error',
      enabled: true,
    },
    {
      id: 'test_required',
      rule: '代码变更必须有测试',
      message: '修改代码时必须添加或更新测试',
      severity: 'error',
      trigger: ['file_modification', 'module_modification'],
      enabled: true,
    },
    {
      id: 'no_bypass_checkpoint',
      rule: '禁止跳过检查点',
      message: '所有检查点必须通过，不能跳过',
      severity: 'error',
      enabled: true,
    },
    {
      id: 'coverage_required',
      rule: '测试覆盖率要求',
      message: '测试覆盖率必须达到 80% 以上',
      severity: 'error',
      enabled: true,
    },
    {
      id: 'no_any_type',
      rule: '禁止使用 any 类型',
      message: 'TypeScript 代码中禁止使用 any 类型',
      severity: 'error',
      trigger: ['file_modification'],
      enabled: true,
    },
    {
      id: 'doc_required',
      rule: '公共 API 必须有文档',
      message: '所有导出的函数和类必须有 JSDoc 注释',
      severity: 'error',
      trigger: ['export_change', 'api_change'],
      enabled: true,
    },
  ],
};
