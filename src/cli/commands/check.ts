/**
 * harness check 命令
 * 
 * 检查铁律是否满足
 */

import chalk from 'chalk';
import { IronLawChecker } from '../../core/iron-laws/checker';
import { getAllLaws } from '../../core/iron-laws/definitions';
import type { IronLawTrigger, IronLawContext, IronLawResult } from '../../types/iron-law';

export interface CheckOptions {
  /** 预设名称 */
  preset: string;
  /** 是否只检查暂存文件 */
  staged: boolean;
  /** 触发条件 */
  trigger?: IronLawTrigger;
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
function detectTrigger(changedFiles: string[], options: CheckOptions): IronLawTrigger {
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
 * 执行铁律检查
 */
export async function check(options: CheckOptions): Promise<void> {
  console.log(chalk.blue('🔍 检查铁律...'));
  console.log(chalk.gray(`预设: ${options.preset}`));

  const checker = IronLawChecker.getInstance();
  const allLaws = getAllLaws();

  // 获取变更文件
  const changedFiles = await getChangedFiles(options.staged);
  if (changedFiles.length > 0) {
    console.log(chalk.gray(`变更文件: ${changedFiles.length} 个`));
  }

  // 检测触发条件
  const trigger = detectTrigger(changedFiles, options);
  console.log(chalk.gray(`触发条件: ${trigger}`));

  // 构建上下文
  const context: IronLawContext = {
    operation: trigger,
    projectPath: options.projectPath || process.cwd(),
    changedFiles,
    hasTest: changedFiles.some(f => f.includes('.test.') || f.includes('.spec.')),
    hasFailingTest: false, // TODO: 实际检查测试状态
    hasRootCauseInvestigation: false, // TODO: 检查是否有根因分析文档
    hasVerificationEvidence: false, // TODO: 检查是否有验证证据
    hasReuseCheck: false, // TODO: 检查是否有复用检查
  };

  // 执行检查
  const results: IronLawResult[] = await checker.checkAll(context);

  // 统计结果
  const passed = results.filter(r => r.satisfied);
  const violations = results.filter(r => !r.satisfied);
  const errors = violations.filter(r => r.law?.severity === 'error');
  const warnings = violations.filter(r => r.law?.severity === 'warning');

  // 输出结果
  console.log();
  
  if (passed.length > 0) {
    console.log(chalk.green(`✅ 通过: ${passed.length} 条`));
    passed.forEach(r => {
      if (r.law) {
        console.log(chalk.gray(`   - ${r.law.id}`));
      }
    });
  }

  if (warnings.length > 0) {
    console.log(chalk.yellow(`⚠️  警告: ${warnings.length} 条`));
    warnings.forEach(r => {
      if (r.law) {
        console.log(chalk.yellow(`   - ${r.law.id}: ${r.law.message}`));
      }
    });
  }

  if (errors.length > 0) {
    console.log(chalk.red(`❌ 违规: ${errors.length} 条`));
    errors.forEach(r => {
      if (r.law) {
        console.log(chalk.red(`   - ${r.law.id}: ${r.law.message}`));
        console.log(chalk.red(`     ${r.law.rule}`));
      }
    });
    console.log();
    console.log(chalk.red('🛑 铁律检查失败，请修复后再提交'));
    process.exit(1);
  }

  console.log();
  console.log(chalk.green('✅ 所有铁律检查通过'));
}

/**
 * 列出所有铁律
 */
export function listLaws(): void {
  const laws = getAllLaws();

  console.log(chalk.blue('\n📜 所有铁律:\n'));

  laws.forEach(law => {
    const icon = law.severity === 'error' ? '🔴' : law.severity === 'warning' ? '🟡' : '🔵';
    console.log(`${icon} ${chalk.bold(law.id)}`);
    console.log(chalk.gray(`   ${law.rule}`));
    console.log(chalk.gray(`   ${law.message}`));
    console.log();
  });
}
