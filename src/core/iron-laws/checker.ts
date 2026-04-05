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
        // 可扩展其他例外条件
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
