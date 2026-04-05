/**
 * harness check 命令
 * 
 * 检查约束是否满足（三层：Iron Laws / Guidelines / Tips）
 */

import chalk from 'chalk';
import { constraintChecker } from '../../core/constraints/checker';
import { getAllConstraints, IRON_LAWS, GUIDELINES, TIPS } from '../../core/constraints/definitions';
import type { ConstraintTrigger, ConstraintContext, ConstraintResult } from '../../types/constraint';

export interface CheckOptions {
  /** 预设名称 */
  preset: string;
  /** 是否只检查暂存文件 */
  staged: boolean;
  /** 触发条件 */
  trigger?: ConstraintTrigger;
  /** 项目路径 */
  projectPath?: string;
}

/**
 * 从 git diff 获取变更的文件
 */
async function getChangedFiles(staged: boolean): Promise<string[]> {
  const { exec } = await import('child_process');
  const { promisify } = await import('util');
  const execAsync = promisify(exec);

  try {
    const command = staged ? 'git diff --cached --name-only' : 'git diff --name-only';
    const { stdout } = await execAsync(command);
    return stdout.trim().split('\n').filter(Boolean);
  } catch {
    return [];
  }
}

/**
 * 检测触发条件
 */
function detectTrigger(changedFiles: string[], options: CheckOptions): ConstraintTrigger {
  // 如果指定了触发条件，直接使用
  if (options.trigger) {
    return options.trigger;
  }

  // 根据变更文件推断触发条件
  const hasCodeChange = changedFiles.some(f => 
    f.endsWith('.ts') || f.endsWith('.tsx') || f.endsWith('.js') || f.endsWith('.jsx')
  );
  const hasTestChange = changedFiles.some(f => 
    f.includes('.test.') || f.includes('.spec.') || f.includes('__tests__')
  );
  const hasModuleChange = changedFiles.some(f => 
    f.includes('src/') && !f.includes('__tests__')
  );

  if (hasCodeChange && !hasTestChange) {
    return 'code_implementation';
  }
  if (hasModuleChange) {
    return 'module_modification';
  }

  return 'file_modification';
}

/**
 * 执行约束检查
 */
export async function check(options: CheckOptions): Promise<void> {
  console.log(chalk.blue('🔍 检查约束...'));
  console.log(chalk.gray(`预设: ${options.preset}`));

  // 获取变更文件
  const changedFiles = await getChangedFiles(options.staged);
  if (changedFiles.length > 0) {
    console.log(chalk.gray(`变更文件: ${changedFiles.length} 个`));
  }

  // 检测触发条件
  const trigger = detectTrigger(changedFiles, options);
  console.log(chalk.gray(`触发条件: ${trigger}`));

  // 构建上下文
  const context: ConstraintContext = {
    operation: trigger,
    projectPath: options.projectPath || process.cwd(),
    changedFiles,
    hasTest: changedFiles.some(f => f.includes('.test.') || f.includes('.spec.')),
    hasFailingTest: false, // TODO: 实际检查测试状态
    hasRootCauseInvestigation: false, // TODO: 检查是否有根因分析文档
    hasVerificationEvidence: false, // TODO: 检查是否有验证证据
    hasReuseCheck: false, // TODO: 检查是否有复用检查
  };

  // 执行三层检查
  const result = await constraintChecker.checkConstraints(context);

  // 输出结果
  console.log();
  
  // Iron Laws
  const ironLawViolations = result.ironLaws.filter(r => !r.satisfied);
  if (ironLawViolations.length === 0 && result.ironLaws.length > 0) {
    console.log(chalk.green(`✅ 铁律: 全部通过 (${result.ironLaws.length} 条)`));
  } else if (ironLawViolations.length > 0) {
    console.log(chalk.red(`❌ 铁律违规: ${ironLawViolations.length} 条`));
    ironLawViolations.forEach(r => {
      if (r.constraint) {
        console.log(chalk.red(`   - ${r.constraint.id}: ${r.constraint.message}`));
        console.log(chalk.red(`     ${r.constraint.rule}`));
      }
    });
    console.log();
    console.log(chalk.red('🛑 铁律检查失败，请修复后再提交'));
    process.exit(1);
  }

  // Guidelines
  if (result.warningCount > 0) {
    console.log(chalk.yellow(`⚠️  指导原则警告: ${result.warningCount} 条`));
    result.guidelines.filter(r => !r.satisfied).forEach(r => {
      if (r.constraint) {
        console.log(chalk.yellow(`   - ${r.constraint.id}: ${r.constraint.message}`));
      }
    });
  } else if (result.guidelines.length > 0) {
    const passedGuidelines = result.guidelines.filter(r => r.satisfied).length;
    console.log(chalk.green(`✅ 指导原则: ${passedGuidelines}/${result.guidelines.length} 通过`));
  }

  // Tips
  if (result.tipCount > 0) {
    console.log(chalk.blue(`💡 提示: ${result.tipCount} 条`));
    result.tips.filter(r => !r.satisfied).forEach(r => {
      if (r.constraint) {
        console.log(chalk.blue(`   - ${r.constraint.id}: ${r.constraint.message}`));
      }
    });
  }

  console.log();
  console.log(chalk.green('✅ 约束检查通过'));
}

/**
 * 列出所有约束
 */
export function listLaws(): void {
  console.log(chalk.blue('\n📜 所有约束:\n'));

  // Iron Laws
  console.log(chalk.red('🔴 铁律 (Iron Laws) - 绝对禁止，无例外:\n'));
  Object.values(IRON_LAWS).forEach(constraint => {
    console.log(chalk.red(`  ${constraint.id}`));
    console.log(chalk.gray(`    ${constraint.rule}`));
    console.log(chalk.gray(`    ${constraint.message}`));
    console.log();
  });

  // Guidelines
  console.log(chalk.yellow('🟡 指导原则 (Guidelines) - 优先建议，有例外:\n'));
  Object.values(GUIDELINES).forEach(constraint => {
    console.log(chalk.yellow(`  ${constraint.id}`));
    console.log(chalk.gray(`    ${constraint.rule}`));
    console.log(chalk.gray(`    ${constraint.message}`));
    if (constraint.exceptions && constraint.exceptions.length > 0) {
      console.log(chalk.gray(`    例外: ${constraint.exceptions.join(', ')}`));
    }
    console.log();
  });

  // Tips
  console.log(chalk.blue('🔵 提示 (Tips) - 信息性，可忽略:\n'));
  Object.values(TIPS).forEach(constraint => {
    console.log(chalk.blue(`  ${constraint.id}`));
    console.log(chalk.gray(`    ${constraint.rule}`));
    console.log(chalk.gray(`    ${constraint.message}`));
    console.log();
  });
}