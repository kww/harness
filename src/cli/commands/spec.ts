/**
 * harness spec validate 命令
 * 
 * 验证 Spec 文件格式
 * 
 * 设计原则：
 * - 框架不包含具体 Schema 定义
 * - 项目需要定义自己的 Spec Schema
 * - 支持动态加载项目的 Schema
 */

import chalk from 'chalk';
import * as path from 'path';
import { SpecValidator, validateAllSpecs } from '../../core/spec/validator';
import type { BatchSpecValidationResult, SpecValidationResult } from '../../types/spec';

export interface SpecValidateOptions {
  /** Schema 路径（项目定义） */
  schema?: string;
  /** 只验证暂存文件 */
  staged?: boolean;
  /** 验证指定文件 */
  file?: string;
  /** 项目路径 */
  projectPath?: string;
  /** 详细输出 */
  verbose?: boolean;
}

/**
 * 执行 Spec 验证
 */
export async function specValidate(options: SpecValidateOptions): Promise<void> {
  console.log(chalk.blue('📋 验证 Spec 文件...'));

  const projectPath = options.projectPath || process.cwd();
  const validator = SpecValidator.getInstance();

  // 设置 Schema 路径
  if (options.schema) {
    const absoluteSchemaPath = path.resolve(projectPath, options.schema);
    validator.setConfig({ schemaPath: absoluteSchemaPath });
    console.log(chalk.gray(`Schema 路径: ${absoluteSchemaPath}`));
  }

  let result: BatchSpecValidationResult | SpecValidationResult;

  // 单文件验证
  if (options.file) {
    const absoluteFilePath = path.resolve(projectPath, options.file);
    console.log(chalk.gray(`验证文件: ${absoluteFilePath}`));
    result = await validator.validateFile(absoluteFilePath);
    printSingleResult(result, options.verbose);
    return;
  }

  // 批量验证
  console.log(chalk.gray(`项目路径: ${projectPath}`));
  console.log(chalk.gray(`仅暂存: ${options.staged ? '是' : '否'}`));
  console.log();

  result = await validateAllSpecs(projectPath, options.staged);

  // 打印结果
  printBatchResult(result, options.verbose);

  // 根据失败级别决定退出码
  if (!options.staged && result.failed > 0) {
    process.exitCode = 1;
  }
}

/**
 * 打印单个文件验证结果
 */
function printSingleResult(result: SpecValidationResult, verbose?: boolean): void {
  if (result.valid) {
    console.log(chalk.green(`✅ ${result.file} 验证通过`));
  } else {
    console.log(chalk.red(`❌ ${result.file} 验证失败`));
  }

  if (result.errors.length > 0) {
    console.log();
    console.log(chalk.red('错误:'));
    for (const error of result.errors) {
      console.log(chalk.red(`  - ${error.path ? error.path + ': ' : ''}${error.message}`));
    }
  }

  if (result.warnings.length > 0) {
    console.log();
    console.log(chalk.yellow('警告:'));
    for (const warning of result.warnings) {
      console.log(chalk.yellow(`  - ${warning.path ? warning.path + ': ' : ''}${warning.message}`));
    }
  }

  if (verbose && result.metrics) {
    console.log();
    console.log(chalk.gray('指标:'));
    for (const [key, value] of Object.entries(result.metrics)) {
      console.log(chalk.gray(`  - ${key}: ${value}`));
    }
  }
}

/**
 * 打印批量验证结果
 */
function printBatchResult(result: BatchSpecValidationResult, verbose?: boolean): void {
  // 汇总
  console.log(chalk.bold('验证结果:'));
  console.log(chalk.gray(`  总文件数: ${result.total}`));
  console.log(chalk.green(`  通过: ${result.passed}`));
  console.log(chalk.red(`  失败: ${result.failed}`));
  console.log(chalk.yellow(`  警告: ${result.warnings}`));
  console.log();

  // 详细结果
  if (verbose || result.failed > 0) {
    for (const r of result.results) {
      if (!r.valid || verbose) {
        printSingleResult(r, verbose);
        console.log();
      }
    }
  }

  // 成功提示
  if (result.failed === 0 && result.total > 0) {
    console.log(chalk.green('✅ 所有 Spec 文件验证通过'));
  } else if (result.total === 0) {
    console.log(chalk.gray('没有找到 Spec 文件，跳过验证'));
    console.log();
    console.log(chalk.gray('提示: Spec 文件包括:'));
    console.log(chalk.gray('  - ARCHITECTURE.md'));
    console.log(chalk.gray('  - specs/ 目录下的 .yml/.yaml 文件'));
    console.log();
    console.log(chalk.gray('要定义自己的 Schema，请在项目中创建:'));
    console.log(chalk.gray('  src/specs/schemas/index.ts'));
    console.log(chalk.gray('  导出 validate 函数'));
  }
}

/**
 * 列出支持的 Spec 类型
 */
export function listSpecTypes(): void {
  console.log(chalk.blue('📋 支持的 Spec 类型:'));
  console.log();
  console.log('  architecture  - ARCHITECTURE.md 架构文档');
  console.log('  module        - 模块定义（specs/modules/*.yml）');
  console.log('  api           - API 定义（specs/apis/*.yml）');
  console.log('  custom        - 自定义 Spec');
  console.log();
  console.log(chalk.gray('提示: 项目可以定义自己的 Schema 进行验证'));
}
