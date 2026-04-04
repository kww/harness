/**
 * harness init 命令
 */

import chalk from 'chalk';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface InitOptions {
  preset: string;
  template?: string;
}

export async function init(options: InitOptions): Promise<void> {
  console.log(chalk.blue('🚀 初始化项目...'));
  console.log(chalk.gray(`预设: ${options.preset}`));
  
  // 创建 .harness 目录
  const harnessDir = path.join(process.cwd(), '.harness');
  await fs.mkdir(harnessDir, { recursive: true });
  
  // 创建 presets.yml
  const presetsPath = path.join(harnessDir, 'presets.yml');
  await fs.writeFile(presetsPath, `# Harness 预设配置
preset: ${options.preset}

# 自定义铁律（可选）
# iron_laws:
#   - id: my_custom_law
#     rule: "自定义规则"
#     message: "违规消息"
#     severity: warning
`);
  
  console.log(chalk.green('✅ 已创建 .harness/presets.yml'));
  
  // 创建 GitHub Actions workflow
  const workflowDir = path.join(process.cwd(), '.github', 'workflows');
  await fs.mkdir(workflowDir, { recursive: true });
  
  const workflowPath = path.join(workflowDir, 'harness-check.yml');
  await fs.writeFile(workflowPath, `name: Harness Check

on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npx @kww/harness check
      - run: npx @kww/harness passes-gate
`);
  
  console.log(chalk.green('✅ 已创建 .github/workflows/harness-check.yml'));
  console.log(chalk.gray('\n下一步：'));
  console.log(chalk.gray('  1. 运行 npx harness check 检查铁律'));
  console.log(chalk.gray('  2. 运行 npx harness passes-gate 验证测试门控'));
}
