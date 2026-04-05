/**
 * 约束检查引擎
 * 
 * 三层约束体系检查：
 * - Iron Laws：检查失败立即抛出异常
 * - Guidelines：检查失败记录警告
 * - Tips：检查失败记录提示
 */

import type {
  Constraint,
  ConstraintContext,
  ConstraintResult,
  ConstraintCheckResult,
  ConstraintTrigger,
  ConstraintLevel,
} from '../../types/constraint';
import { ConstraintViolationError } from '../../types/constraint';
import type { ExecutionTrace } from '../../types/trace';
import { getTraceCollector } from '../../monitoring/traces';
import { IRON_LAWS, GUIDELINES, TIPS } from './definitions';
import type { MergedConstraintsConfig } from '../../types/project-config';

/**
 * 约束检查器
 */
export class ConstraintChecker {
  private static instance: ConstraintChecker;

  /** 自定义约束配置（项目级） */
  private customConfig: MergedConstraintsConfig | null = null;

  private constructor() {}

  /**
   * 获取单例实例
   */
  static getInstance(): ConstraintChecker {
    if (!ConstraintChecker.instance) {
      ConstraintChecker.instance = new ConstraintChecker();
    }
    return ConstraintChecker.instance;
  }

  /**
   * 设置项目级约束配置
   */
  setCustomConfig(config: MergedConstraintsConfig): void {
    this.customConfig = config;
  }

  /**
   * 获取当前的约束集合（内置 + 自定义）
   */
  getConstraints(): {
    ironLaws: Record<string, Constraint>;
    guidelines: Record<string, Constraint>;
    tips: Record<string, Constraint>;
  } {
    if (this.customConfig) {
      return {
        ironLaws: this.customConfig.ironLaws,
        guidelines: this.customConfig.guidelines,
        tips: this.customConfig.tips,
      };
    }
    return {
      ironLaws: IRON_LAWS,
      guidelines: GUIDELINES,
      tips: TIPS,
    };
  }

  /**
   * 检查单个约束
   */
  async check(
    constraint: Constraint,
    context: ConstraintContext
  ): Promise<ConstraintResult> {
    // 检查例外条件（仅 Guidelines 有效）
    if (constraint.level === 'guideline' && constraint.exceptions) {
      if (this.checkException(constraint, context)) {
        return {
          id: constraint.id,
          level: constraint.level,
          satisfied: true,
          constraint,
          message: `指导原则 ${constraint.id} 因例外条件被豁免`,
          checkedAt: new Date(),
        };
      }
    }

    // 检查前置条件
    const satisfied = await this.checkPrecondition(constraint, context);

    return {
      id: constraint.id,
      level: constraint.level,
      satisfied,
      constraint,
      message: satisfied ? undefined : constraint.message,
      requiredAction: satisfied ? undefined : constraint.enforcement,
      checkedAt: new Date(),
    };
  }

  /**
   * 检查例外条件
   */
  private checkException(constraint: Constraint, context: ConstraintContext): boolean {
    if (!constraint.exceptions) return false;

    for (const exception of constraint.exceptions) {
      switch (exception) {
        // simplest_solution_first 例外
        case 'scalability_required':
          if (context.scalabilityRequired) return true;
          break;
        case 'security_required':
          if (context.securityRequired) return true;
          break;
        case 'performance_required':
          if (context.performanceRequired) return true;
          break;
        case 'reliability_required':
          if (context.reliabilityRequired) return true;
          break;

        // no_fix_without_root_cause 例外
        case 'simple_typo':
          if (context.isSimpleTypo) return true;
          break;
        case 'config_value_error':
          if (context.isConfigValueError) return true;
          break;
        case 'missing_config':
          if (context.isMissingConfig) return true;
          break;

        // no_code_without_test 例外
        case 'config_file':
          if (context.isConfigFile) return true;
          break;
        case 'type_definition':
          if (context.isTypeDefinition) return true;
          break;
        case 'simple_accessor':
          if (context.isSimpleAccessor) return true;
          break;
        case 'pure_display_component':
          if (context.isPureDisplayComponent) return true;
          break;

        // no_any_type 例外
        case 'json_parse_result':
          if (context.isJsonParseResult) return true;
          break;
        case 'third_party_no_types':
          if (context.isThirdPartyNoTypes) return true;
          break;
        case 'legacy_migration':
          if (context.isLegacyMigration) return true;
          break;

        // capability_sync 例外
        case 'internal_refactor':
          if (context.isInternalRefactor) return true;
          break;
        case 'bug_fix_only':
          if (context.isBugFixOnly) return true;
          break;
        case 'performance_optimization':
          if (context.isPerformanceOptimization) return true;
          break;

        // no_simplification_without_approval 例外
        case 'redundant_code_cleanup':
          if (context.isRedundantCodeCleanup) return true;
          break;
        case 'same_effect_refactor':
          if (context.isSameEffectRefactor) return true;
          break;
        case 'unused_code_removal':
          if (context.isUnusedCodeRemoval) return true;
          break;
      }
    }

    return false;
  }

  /**
   * 根据约束层级获取严重性
   */
  private getSeverity(level: ConstraintLevel): 'error' | 'warning' | 'info' {
    switch (level) {
      case 'iron_law':
        return 'error';
      case 'guideline':
        return 'warning';
      case 'tip':
        return 'info';
      default:
        return 'warning';
    }
  }

  /**
   * 检查约束前置条件
   */
  private async checkPrecondition(
    constraint: Constraint,
    context: ConstraintContext
  ): Promise<boolean> {
    switch (constraint.id) {
      // Iron Laws
      case 'no_bypass_checkpoint':
        // TODO: 检查是否跳过了检查点
        return true;

      case 'no_self_approval':
        // 检查是否有测试证据
        return context.hasTest === true;

      case 'no_completion_without_verification':
        // 检查是否有验证证据
        return context.hasVerificationEvidence === true;

      case 'no_test_simplification':
        // TODO: 检查是否简化了测试
        return true;

      // Guidelines
      case 'no_fix_without_root_cause':
        // 检查是否有根本原因调查
        return context.hasRootCauseInvestigation === true;

      case 'no_code_without_test':
        // 检查是否有失败的测试
        return context.hasFailingTest === true;

      case 'no_any_type':
        // TODO: 检查代码中是否有 any 类型
        return true;

      case 'simplest_solution_first':
        // 检查是否已检查本地数据源
        return context.hasReuseCheck === true;

      case 'no_creation_without_reuse_check':
        // 检查是否已进行复用检查
        return context.hasReuseCheck === true;

      case 'capability_sync':
        // TODO: 检查 CAPABILITIES.md 是否更新
        return true;

      case 'no_simplification_without_approval':
        // TODO: 检查是否简化了逻辑
        return true;

      case 'no_skill_without_test':
        // 检查是否有测试
        return context.hasTest === true;

      case 'test_coverage_required':
        // TODO: 检查测试覆盖率
        return true;

      // Tips - 总是返回 true（仅提示）
      case 'readme_required':
        return true;

      case 'doc_required_for_public_api':
        return true;

      default:
        // 未知约束，默认通过
        return true;
    }
  }

  /**
   * 查找适用于当前操作的约束
   */
  findApplicableConstraints(context: ConstraintContext): {
    ironLaws: Constraint[];
    guidelines: Constraint[];
    tips: Constraint[];
  } {
    const trigger = context.operation;
    const constraints = this.getConstraints();

    const filterByTrigger = (constraintSet: Record<string, Constraint>): Constraint[] => {
      return Object.values(constraintSet).filter(constraint => {
        const triggers = Array.isArray(constraint.trigger)
          ? constraint.trigger
          : [constraint.trigger];
        return triggers.includes(trigger);
      });
    };

    return {
      ironLaws: filterByTrigger(constraints.ironLaws),
      guidelines: filterByTrigger(constraints.guidelines),
      tips: filterByTrigger(constraints.tips),
    };
  }

  /**
   * 执行三层约束检查
   * 
   * - Iron Laws：检查失败立即抛出异常
   * - Guidelines：检查失败记录警告
   * - Tips：检查失败记录提示
   */
  async checkConstraints(context: ConstraintContext): Promise<ConstraintCheckResult> {
    const result: ConstraintCheckResult = {
      ironLaws: [],
      guidelines: [],
      tips: [],
      passed: true,
      warningCount: 0,
      tipCount: 0,
    };

    // 获取 trace 收集器（可选启用）
    const traceCollector = getTraceCollector();

    // 获取约束集合（内置 + 自定义）
    const constraints = this.getConstraints();

    // 1. 检查 Iron Laws（必须全部通过）
    for (const constraint of Object.values(constraints.ironLaws)) {
      const triggers = Array.isArray(constraint.trigger)
        ? constraint.trigger
        : [constraint.trigger];

      if (!triggers.includes(context.operation)) continue;

      const checkResult = await this.check(constraint, context);
      result.ironLaws.push(checkResult);

      // 记录 trace
      traceCollector.record({
        constraintId: constraint.id,
        level: 'iron_law',
        timestamp: Date.now(),
        result: checkResult.satisfied ? 'pass' : 'fail',
        operation: context.operation,
        severity: this.getSeverity(constraint.level),
        exceptionApplied: checkResult.message?.includes('豁免') ? constraint.exceptions?.[0] : undefined,
        projectPath: context.projectPath,
        sessionId: context.sessionId,
      });

      if (!checkResult.satisfied) {
        result.passed = false;
        throw new ConstraintViolationError(checkResult);
      }
    }

    // 2. 检查 Guidelines（记录警告）
    for (const constraint of Object.values(GUIDELINES)) {
      const triggers = Array.isArray(constraint.trigger)
        ? constraint.trigger
        : [constraint.trigger];

      if (!triggers.includes(context.operation)) continue;

      const checkResult = await this.check(constraint, context);
      result.guidelines.push(checkResult);

      // 记录 trace
      const severity = this.getSeverity(constraint.level);
      traceCollector.record({
        constraintId: constraint.id,
        level: 'guideline',
        timestamp: Date.now(),
        result: checkResult.satisfied ? 'pass' : 'fail',
        operation: context.operation,
        severity,
        exceptionApplied: checkResult.message?.includes('豁免') ? constraint.exceptions?.[0] : undefined,
        projectPath: context.projectPath,
        sessionId: context.sessionId,
      });

      if (!checkResult.satisfied) {
        result.warningCount++;
      }
    }

    // 3. 检查 Tips（仅记录）
    for (const constraint of Object.values(constraints.tips)) {
      const triggers = Array.isArray(constraint.trigger)
        ? constraint.trigger
        : [constraint.trigger];

      if (!triggers.includes(context.operation)) continue;

      const checkResult = await this.check(constraint, context);
      result.tips.push(checkResult);

      // 记录 trace
      traceCollector.record({
        constraintId: constraint.id,
        level: 'tip',
        timestamp: Date.now(),
        result: checkResult.satisfied ? 'pass' : 'fail',
        operation: context.operation,
        severity: this.getSeverity(constraint.level),
        projectPath: context.projectPath,
        sessionId: context.sessionId,
      });

      if (!checkResult.satisfied) {
        result.tipCount++;
      }
    }

    return result;
  }

  /**
   * 执行前检查（仅检查 Iron Laws）
   * 
   * @throws ConstraintViolationError 如果有铁律违规
   */
  async beforeExecution(context: ConstraintContext): Promise<void> {
    const triggers = Array.isArray(context.operation) ? context.operation : [context.operation];
    const constraints = this.getConstraints();

    for (const constraint of Object.values(constraints.ironLaws)) {
      const constraintTriggers = Array.isArray(constraint.trigger)
        ? constraint.trigger
        : [constraint.trigger];

      const matches = triggers.some(t => constraintTriggers.includes(t));
      if (!matches) continue;

      const result = await this.check(constraint, context);

      if (!result.satisfied) {
        throw new ConstraintViolationError(result);
      }
    }
  }
}

// ========================================
// 快捷函数
// ========================================

/**
 * 快捷函数：检查约束
 */
export async function checkConstraint(
  constraintId: string,
  context: ConstraintContext
): Promise<ConstraintResult> {
  const checker = ConstraintChecker.getInstance();
  const constraints = checker.getConstraints();

  const constraint =
    constraints.ironLaws[constraintId] ||
    constraints.guidelines[constraintId] ||
    constraints.tips[constraintId];

  if (!constraint) {
    return {
      id: constraintId,
      level: 'tip',
      satisfied: false,
      message: `未知的约束: ${constraintId}`,
      checkedAt: new Date(),
    };
  }

  return checker.check(constraint, context);
}

/**
 * 快捷函数：执行三层检查
 */
export async function checkConstraints(
  context: ConstraintContext
): Promise<ConstraintCheckResult> {
  return ConstraintChecker.getInstance().checkConstraints(context);
}

/**
 * 快捷函数：执行前检查
 */
export async function checkBeforeExecution(context: ConstraintContext): Promise<void> {
  return ConstraintChecker.getInstance().beforeExecution(context);
}

// 导出单例
export const constraintChecker = ConstraintChecker.getInstance();

// ========================================
// 向后兼容的类和函数
// ========================================

/**
 * @deprecated 使用 ConstraintChecker 代替
 */
export const IronLawChecker = ConstraintChecker;

/**
 * @deprecated 使用 checkConstraint 代替
 */
export async function checkIronLaw(
  lawId: string,
  context: ConstraintContext
): Promise<ConstraintResult> {
  return checkConstraint(lawId, context);
}

/**
 * @deprecated 使用 checkConstraints 代替
 */
export async function checkAllIronLaws(
  context: ConstraintContext
): Promise<ConstraintResult[]> {
  const result = await checkConstraints(context);
  return [...result.ironLaws, ...result.guidelines, ...result.tips];
}

/**
 * @deprecated 使用 constraintChecker 代替
 */
export const ironLawChecker = constraintChecker;