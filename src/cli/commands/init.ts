/**
 * harness init 命令
 * 
 * 初始化项目的 harness 配置
 */

import chalk from 'chalk';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { createExampleCheckpoint } from './validate';

export interface InitOptions {
  /** 项目路径 */
  projectPath?: string;
  /** 预设名称 */
  preset: 'strict' | 'standard' | 'relaxed';
  /** 项目类型 */
  type?: 'node-api' | 'nextjs-app' | 'python-api' | 'custom';
  /** 是否创建 Git hooks */
  gitHooks?: boolean;
  /** 是否创建 GitHub Actions */
  githubActions?: boolean;
}

/**
 * 默认配置
 */
const DEFAULT_CONFIG = {
  preset: 'standard',
  enabled: true,
  ironLaws: {
    enforceErrors: true,
    warnWarnings: true,
  },
  validators: {
    checkpoint: true,
    passesGate: true,
    cso: false,
  },
};

/**
 * 预设配置
 */
const PRESETS = {
  strict: {
    ...DEFAULT_CONFIG,
    preset: 'strict',
    ironLaws: {
      enforceErrors: true,
      warnWarnings: true,
    },
    validators: {
      checkpoint: true,
      passesGate: true,
      cso: true,
    },
  },
  standard: {
    ...DEFAULT_CONFIG,
    preset: 'standard',
  },
  relaxed: {
    ...DEFAULT_CONFIG,
    preset: 'relaxed',
    ironLaws: {
      enforceErrors: true,
      warnWarnings: false,
    },
  },
};

/**
 * 初始化项目
 */
export async function init(options: InitOptions): Promise<void> {
  console.log(chalk.blue('🚀 初始化 harness 配置...'));

  const projectPath = options.projectPath || process.cwd();
  const configDir = path.join(projectPath, '.harness');

  // 创建配置目录
  await fs.mkdir(configDir, { recursive: true });
  console.log(chalk.gray(`配置目录: ${configDir}`));

  // 选择预设
  const preset = PRESETS[options.preset];
  console.log(chalk.gray(`预设: ${options.preset}`));

  // 写入配置文件
  const configPath = path.join(configDir, 'config.yml');
  const configContent = yaml.dump(preset, { indent: 2 });
  await fs.writeFile(configPath, configContent, 'utf-8');
  console.log(chalk.green(`✅ 已创建配置文件: ${configPath}`));

  // 创建检查点示例
  await createExampleCheckpoint(projectPath);

  // 创建 CAPABILITIES.md（如果不存在）
  const capabilitiesPath = path.join(projectPath, 'CAPABILITIES.md');
  try {
    await fs.access(capabilitiesPath);
    console.log(chalk.gray(`CAPABILITIES.md 已存在`));
  } catch {
    const capabilitiesContent = `# CAPABILITIES.md

## 功能清单

> 此文件由 harness 自动维护，记录项目的核心功能

### 最后更新
- 时间: ${new Date().toISOString()}
- 触发: harness init

---

## 核心模块

<!-- 在此记录项目的核心模块 -->

## API 能力

<!-- 在此记录项目的 API 能力 -->

## 依赖关系

<!-- 在此记录模块间的依赖关系 -->
`;
    await fs.writeFile(capabilitiesPath, capabilitiesContent, 'utf-8');
    console.log(chalk.green(`✅ 已创建 CAPABILITIES.md`));
  }

  // 创建 Git hooks
  if (options.gitHooks !== false) {
    await setupGitHooks(projectPath);
  }

  // 创建 GitHub Actions
  if (options.githubActions !== false) {
    await setupGitHubActions(projectPath, options.preset);
  }

  console.log();
  console.log(chalk.green('✅ harness 初始化完成！'));
  console.log();
  console.log(chalk.gray('下一步:'));
  console.log(chalk.gray('  1. 编辑 .harness/config.yml 自定义配置'));
  console.log(chalk.gray('  2. 编辑 .harness/checkpoints.yml 添加检查点'));
  console.log(chalk.gray('  3. 运行 `harness check` 检查铁律'));
  console.log(chalk.gray('  4. 运行 `harness validate` 验证检查点'));
}

/**
 * 设置 Git hooks
 */
async function setupGitHooks(projectPath: string): Promise<void> {
  const gitDir = path.join(projectPath, '.git');
  const hooksDir = path.join(gitDir, 'hooks');

  try {
    await fs.access(gitDir);
  } catch {
    console.log(chalk.yellow('⚠️  未检测到 Git 仓库，跳过 Git hooks'));
    return;
  }

  await fs.mkdir(hooksDir, { recursive: true });

  // pre-commit hook
  const preCommitPath = path.join(hooksDir, 'pre-commit');
  const preCommitContent = `#!/bin/sh
# Harness pre-commit hook

echo "🔍 Running harness checks..."

# 铁律检查
npx harness check --staged
if [ $? -ne 0 ]; then
  echo "❌ Iron law check failed"
  exit 1
fi

echo "✅ All checks passed"
`;

  await fs.writeFile(preCommitPath, preCommitContent, 'utf-8');
  await fs.chmod(preCommitPath, 0o755);
  console.log(chalk.green(`✅ 已创建 pre-commit hook`));
}

/**
 * 设置 GitHub Actions
 */
async function setupGitHubActions(projectPath: string, preset: string): Promise<void> {
  const workflowsDir = path.join(projectPath, '.github', 'workflows');

  await fs.mkdir(workflowsDir, { recursive: true });

  // harness-check.yml
  const workflowPath = path.join(workflowsDir, 'harness-check.yml');
  const workflowContent = `name: Harness Check

on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]

jobs:
  harness-check:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run harness check
        run: npx harness check

      - name: Run harness validate
        run: npx harness validate

      - name: Run harness passes-gate
        run: npx harness passes-gate
`;

  await fs.writeFile(workflowPath, workflowContent, 'utf-8');
  console.log(chalk.green(`✅ 已创建 GitHub Action: harness-check.yml`));
}
