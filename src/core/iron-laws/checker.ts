/**
 * 铁律检查引擎
 * 
 * 在执行关键操作前，强制检查铁律是否满足
 */

import type {
  IronLaw,
  IronLawResult,
  IronLawContext,
  IronLawTrigger,
} from '../../types/iron-law';
import { IronLawViolationError, IRON_LAWS, findLawsByTrigger } from './definitions';

/**
 * 铁律检查器
 */
export class IronLawChecker {
  private static instance: IronLawChecker;

  private constructor() {}

  /**
   * 获取单例实例
   */
  static getInstance(): IronLawChecker {
    if (!IronLawChecker.instance) {
      IronLawChecker.instance = new IronLawChecker();
    }
    return IronLawChecker.instance;
  }

  /**
   * 检查单个铁律
   */
  async check(lawId: string, context: IronLawContext): Promise<IronLawResult> {
    const law = IRON_LAWS[lawId];

    if (!law) {
      return {
        satisfied: false,
        message: `未知的铁律: ${lawId}`,
        checkedAt: new Date(),
      };
    }

    // 先检查例外条件
    if (law.exceptions && this.checkException(law, context)) {
      return {
        satisfied: true,
        law,
        message: `铁律 ${lawId} 因例外条件被跳过`,
        checkedAt: new Date(),
      };
    }

    // 检查是否满足铁律前置条件
    const satisfied = await this.checkPrecondition(law, context);

    if (!satisfied) {
      return {
        satisfied: false,
        law,
        message: law.message,
        requiredAction: law.enforcement,
        checkedAt: new Date(),
      };
    }

    return {
      satisfied: true,
      law,
      checkedAt: new Date(),
    };
  }

  /**
   * 检查例外条件是否满足
   */
  private checkException(law: IronLaw, context: IronLawContext): boolean {
    if (!law.exceptions) return false;

    const exceptionReasons: string[] = [];

    for (const exception of law.exceptions) {
      switch (exception) {
        // simplest_solution_first 例外
        case 'scalability_required':
          if (context.scalabilityRequired) exceptionReasons.push('需要多实例/分布式部署');
          break;
        case 'security_required':
          if (context.securityRequired) exceptionReasons.push('需要加密/鉴权等安全措施');
          break;
        case 'performance_required':
          if (context.performanceRequired) exceptionReasons.push('本地方案性能不足');
          break;
        case 'reliability_required':
          if (context.reliabilityRequired) exceptionReasons.push('需要持久化/高可用');
          break;
        
        // no_fix_without_root_cause 例外
        case 'simple_typo':
          if (context.isSimpleTypo) exceptionReasons.push('简单拼写错误');
          break;
        case 'config_value_error':
          if (context.isConfigValueError) exceptionReasons.push('配置值错误');
          break;
        case 'missing_config':
          if (context.isMissingConfig) exceptionReasons.push('缺少必要配置');
          break;
        
        // no_code_without_test 例外
        case 'config_file':
          if (context.isConfigFile) exceptionReasons.push('配置文件');
          break;
        case 'type_definition':
          if (context.isTypeDefinition) exceptionReasons.push('类型定义文件');
          break;
        case 'simple_accessor':
          if (context.isSimpleAccessor) exceptionReasons.push('简单 getter/setter');
          break;
        case 'pure_display_component':
          if (context.isPureDisplayComponent) exceptionReasons.push('纯展示 UI 组件');
          break;
        
        // no_any_type 例外
        case 'json_parse_result':
          if (context.isJsonParseResult) exceptionReasons.push('JSON.parse 结果');
          break;
        case 'third_party_no_types':
          if (context.isThirdPartyNoTypes) exceptionReasons.push('第三方库无类型');
          break;
        case 'legacy_migration':
          if (context.isLegacyMigration) exceptionReasons.push('遗留代码迁移');
          break;
        
        // capability_sync 例外
        case 'internal_refactor':
          if (context.isInternalRefactor) exceptionReasons.push('内部重构不影响接口');
          break;
        case 'bug_fix_only':
          if (context.isBugFixOnly) exceptionReasons.push('仅 bug fix 不改变功能');
          break;
        case 'performance_optimization':
          if (context.isPerformanceOptimization) exceptionReasons.push('性能优化不改变接口');
          break;
        
        // no_simplification_without_approval 例外
        case 'redundant_code_cleanup':
          if (context.isRedundantCodeCleanup) exceptionReasons.push('冗余代码清理');
          break;
        case 'same_effect_refactor':
          if (context.isSameEffectRefactor) exceptionReasons.push('相同效果重构');
          break;
        case 'unused_code_removal':
          if (context.isUnusedCodeRemoval) exceptionReasons.push('未使用代码删除');
          break;
      }
    }

    return exceptionReasons.length > 0;
  }

  /**
   * 检查铁律前置条件
   */
  private async checkPrecondition(law: IronLaw, context: IronLawContext): Promise<boolean> {
    switch (law.id) {
      case 'no_fix_without_root_cause':
        // 检查是否有根本原因调查
        return context.hasRootCauseInvestigation === true;

      case 'no_completion_without_verification':
        // 检查是否有验证证据
        return context.hasVerificationEvidence === true;

      case 'no_skill_without_test':
        // 检查是否有压力场景测试
        return context.hasTest === true;

      case 'no_code_without_test':
        // 检查是否有失败的测试
        return context.hasFailingTest === true;

      case 'no_creation_without_reuse_check':
        // 检查是否已进行复用检查
        return context.hasReuseCheck === true;

      case 'no_self_approval':
        // 检查是否有测试证据
        return context.hasTest === true;

      case 'test_coverage_required':
        // TODO: 检查测试覆盖率
        return true;

      case 'capability_sync':
        // TODO: 检查 CAPABILITIES.md 是否更新
        return true;

      case 'no_any_type':
        // TODO: 检查代码中是否有 any 类型
        return true;

      case 'no_bypass_checkpoint':
        // TODO: 检查是否跳过了检查点
        return true;

      case 'doc_required_for_public_api':
        // TODO: 检查公共 API 是否有文档
        return true;

      case 'readme_required':
        // TODO: 检查是否有 README
        return true;

      case 'simplest_solution_first':
        // 检查是否已检查本地数据源
        // TODO: 可以扩展为检查是否选择了最简单方案
        return context.hasReuseCheck === true;

      default:
        // 未知铁律，默认通过
        return true;
    }
  }

  /**
   * 查找适用于当前操作的铁律
   */
  findApplicableLaws(context: IronLawContext): string[] {
    const applicableLaws: string[] = [];

    for (const [lawId, law] of Object.entries(IRON_LAWS)) {
      // 支持单个 trigger 或数组 trigger
      const triggers = Array.isArray(law.trigger) ? law.trigger : [law.trigger];
      if (triggers.includes(context.operation)) {
        applicableLaws.push(lawId);
      }
    }

    return applicableLaws;
  }

  /**
   * 在执行前自动检查所有适用的铁律
   * 
   * @throws IronLawViolationError 如果有 error 级别的铁律违规
   */
  async beforeExecution(context: IronLawContext): Promise<void> {
    const applicableLaws = this.findApplicableLaws(context);

    for (const lawId of applicableLaws) {
      const result = await this.check(lawId, context);

      if (!result.satisfied && result.law?.severity === 'error') {
        throw new IronLawViolationError(result);
      }
    }
  }

  /**
   * 检查并返回所有铁律状态（用于 UI 显示）
   */
  async checkAll(context: IronLawContext): Promise<IronLawResult[]> {
    const applicableLaws = this.findApplicableLaws(context);
    const results: IronLawResult[] = [];

    for (const lawId of applicableLaws) {
      const result = await this.check(lawId, context);
      results.push(result);
    }

    return results;
  }

  /**
   * 获取所有铁律定义
   */
  getAllLaws(): IronLaw[] {
    return Object.values(IRON_LAWS);
  }

  /**
   * 获取单个铁律定义
   */
  getLaw(lawId: string): IronLaw | null {
    return IRON_LAWS[lawId] || null;
  }
}

/**
 * 快捷函数：检查铁律
 */
export async function checkIronLaw(
  lawId: string,
  context: IronLawContext
): Promise<IronLawResult> {
  return IronLawChecker.getInstance().check(lawId, context);
}

/**
 * 快捷函数：执行前检查
 */
export async function checkBeforeExecution(context: IronLawContext): Promise<void> {
  return IronLawChecker.getInstance().beforeExecution(context);
}

/**
 * 快捷函数：检查所有铁律
 */
export async function checkAllIronLaws(context: IronLawContext): Promise<IronLawResult[]> {
  return IronLawChecker.getInstance().checkAll(context);
}

// 导出单例
export const ironLawChecker = IronLawChecker.getInstance();
