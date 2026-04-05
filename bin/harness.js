#!/usr/bin/env node

/**
 * @dommaker/harness CLI 入口
 * 
 * 通用工程约束框架
 */

const { Command } = require('commander');
const { 
  check, 
  listLaws, 
  validate, 
  runPassesGate, 
  init, 
  report,
  tracesCommand,
  diagnoseCommand,
  proposeCommand
} = require('../dist/cli/commands/index');

const program = new Command();

program
  .name('harness')
  .description('通用工程约束框架 - 铁律系统、检查点验证、测试门控、执行追踪')
  .version('0.3.0');

// ========================================
// harness check
// ========================================
program
  .command('check')
  .description('检查铁律是否满足')
  .option('-p, --preset <preset>', '预设名称', 'standard')
  .option('-s, --staged', '只检查暂存文件', false)
  .option('-t, --trigger <trigger>', '触发条件')
  .option('--project-path <path>', '项目路径')
  .option('--list', '列出所有铁律')
  .action(async (options) => {
    if (options.list) {
      listLaws();
    } else {
      await check(options);
    }
  });

// ========================================
// harness validate
// ========================================
program
  .command('validate')
  .description('验证检查点是否满足')
  .option('-f, --file <path>', '检查点文件路径')
  .option('-p, --project-path <path>', '项目路径')
  .option('--strict', '严格模式（任何失败都退出）', false)
  .action(async (options) => {
    await validate(options);
  });

// ========================================
// harness passes-gate
// ========================================
program
  .command('passes-gate')
  .description('运行测试门控，确保测试通过')
  .alias('pg')
  .option('-t, --test-command <command>', '测试命令')
  .option('-p, --project-path <path>', '项目路径')
  .option('--allow-partial', '允许部分测试通过', false)
  .option('--max-retries <n>', '最大重试次数', '2')
  .option('--coverage', '检查测试覆盖率')
  .option('--coverage-threshold <n>', '覆盖率阈值', '80')
  .action(async (options) => {
    if (options.coverage) {
      const threshold = parseInt(options.coverageThreshold, 10);
      await runPassesGate(options);
      const projectPath = options.projectPath || process.cwd();
      await checkCoverage(projectPath, threshold);
    } else {
      await runPassesGate(options);
    }
  });

// ========================================
// harness init
// ========================================
program
  .command('init')
  .description('初始化项目的 harness 配置')
  .option('-p, --preset <preset>', '预设名称 (strict/standard/relaxed)', 'standard')
  .option('-t, --type <type>', '项目类型 (node-api/nextjs-app/python-api/custom)')
  .option('--project-path <path>', '项目路径')
  .option('--no-git-hooks', '不创建 Git hooks')
  .option('--no-github-actions', '不创建 GitHub Actions')
  .action(async (options) => {
    await init(options);
  });

// ========================================
// harness report
// ========================================
program
  .command('report')
  .description('生成检查报告')
  .option('-o, --output <path>', '输出文件路径')
  .option('-f, --format <format>', '输出格式 (json/markdown)', 'markdown')
  .option('-p, --project-path <path>', '项目路径')
  .action(async (options) => {
    await report(options);
  });

// ========================================
// harness traces
// ========================================
program
  .command('traces [subcommand]')
  .description('Execution Trace 分析')
  .option('--hours <n>', '分析最近 N 小时', '1')
  .option('--constraint <id>', '过滤约束 ID')
  .option('--format <format>', '输出格式 (json/text)', 'text')
  .option('--max-age-days <n>', '清理超过 N 天的文件', '30')
  .action(async (subcommand, options, command) => {
    const sub = subcommand || 'stats';
    await tracesCommand(sub, {
      hours: parseInt(options.hours, 10),
      constraintId: options.constraint,
      format: options.format,
      maxAgeDays: parseInt(options.maxAgeDays, 10),
    });
  });

// ========================================
// harness diagnose
// ========================================
program
  .command('diagnose [subcommand]')
  .description('约束诊断')
  .option('--hours <n>', '分析最近 N 小时', '24')
  .option('--constraint <id>', '过滤约束 ID')
  .option('--anomaly <id>', '特定异常 ID')
  .option('--format <format>', '输出格式 (json/text)', 'text')
  .option('--save', '保存诊断结果', false)
  .action(async (subcommand, options, command) => {
    const sub = subcommand || 'list';
    await diagnoseCommand(sub, {
      hours: parseInt(options.hours, 10),
      constraintId: options.constraint,
      anomalyId: options.anomaly,
      format: options.format,
      save: options.save,
    });
  });

// ========================================
// harness propose
// ========================================
program
  .command('propose [subcommand]')
  .description('约束提案')
  .option('--diagnosis <id>', '诊断 ID')
  .option('--status <status>', '过滤状态')
  .option('--format <format>', '输出格式 (json/text)', 'text')
  .option('--save', '保存提案', false)
  .option('--accept', '接受提案', false)
  .option('--reject', '拒绝提案', false)
  .option('--comment <text>', '审核意见')
  .action(async (subcommand, options, command) => {
    const sub = subcommand || 'list';
    await proposeCommand(sub, {
      diagnosisId: options.diagnosis,
      status: options.status,
      format: options.format,
      save: options.save,
      accept: options.accept,
      reject: options.reject,
      comment: options.comment,
    });
  });

// 解析命令行参数
program.parse();