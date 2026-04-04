#!/usr/bin/env node

/**
 * @kww/harness CLI 入口
 */

import { Command } from 'commander';

const program = new Command();

program
  .name('harness')
  .description('通用工程约束框架')
  .version('0.1.0');

// check 命令
program
  .command('check')
  .description('检查铁律')
  .option('-p, --preset <preset>', '预设名称', 'standard')
  .option('--staged', '只检查暂存的文件', false)
  .action(async (options) => {
    const { check } = await import('../dist/cli/commands/check.js');
    await check(options);
  });

// validate 命令
program
  .command('validate')
  .description('验证检查点')
  .option('-c, --checkpoint <id>', '检查点 ID', 'all')
  .action(async (options) => {
    const { validate } = await import('../dist/cli/commands/validate.js');
    await validate(options);
  });

// passes-gate 命令
program
  .command('passes-gate')
  .description('测试门控验证')
  .option('--require-evidence', '需要测试证据', false)
  .action(async (options) => {
    const { passesGate } = await import('../dist/cli/commands/passes-gate.js');
    await passesGate(options);
  });

// init 命令
program
  .command('init')
  .description('初始化项目')
  .option('-p, --preset <preset>', '预设名称', 'standard')
  .option('-t, --template <template>', '项目模板')
  .action(async (options) => {
    const { init } = await import('../dist/cli/commands/init.js');
    await init(options);
  });

// report 命令
program
  .command('report')
  .description('生成检查报告')
  .option('-o, --output <format>', '输出格式', 'text')
  .action(async (options) => {
    const { report } = await import('../dist/cli/commands/report.js');
    await report(options);
  });

program.parse();
