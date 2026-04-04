/**
 * 铁律检查引擎
 * 
 * 在执行关键操作前，强制检查铁律是否满足
 */

import {
  IronLaw,
  IronLawResult,
  IronLawContext,
  IronLawViolationError,
  IRON_LAWS,
  IronLawTrigger,
} from './iron-laws';

/**
 * 铁律检查器
 */
export class IronLawChecker {
  private static instance: IronLawChecker;

  private constructor() {}

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

      default:
        return true;
    }
  }

  /**
   * 查找适用于当前操作的铁律
   */
  findApplicableLaws(context: IronLawContext): string[] {
    const applicableLaws: string[] = [];

    for (const [lawId, law] of Object.entries(IRON_LAWS)) {
      if (law.trigger === context.operation) {
        applicableLaws.push(lawId);
      }
    }

    return applicableLaws;
  }

  /**
   * 在执行前自动检查所有适用的铁律
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

// 导出单例
export const ironLawChecker = IronLawChecker.getInstance();

/**
 * 快捷函数：检查铁律
 */
export async function checkIronLaw(
  operation: IronLawTrigger,
  context?: Partial<IronLawContext>
): Promise<IronLawResult[]> {
  const fullContext: IronLawContext = {
    operation,
    ...context,
  };

  return ironLawChecker.checkAll(fullContext);
}

/**
 * 快捷函数：强制执行铁律检查（失败时抛出异常）
 */
export async function enforceIronLaws(
  operation: IronLawTrigger,
  context?: Partial<IronLawContext>
): Promise<void> {
  const fullContext: IronLawContext = {
    operation,
    ...context,
  };

  await ironLawChecker.beforeExecution(fullContext);
}
