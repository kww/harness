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

  // 创建自定义约束示例
  await createCustomConstraintsExample(projectPath);

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

/**
 * 创建自定义约束示例
 */
async function createCustomConstraintsExample(projectPath: string): Promise<void> {
  const configDir = path.join(projectPath, '.harness');
  const customConstraintsPath = path.join(configDir, 'custom-constraints.yml');

  // 如果已存在，不覆盖
  try {
    await fs.access(customConstraintsPath);
    console.log(chalk.gray(`custom-constraints.yml 已存在`));
    return;
  } catch {
    // 文件不存在，创建
  }

  const content = `# 自定义约束配置
#
# 此文件定义项目特定的约束，扩展或覆盖 harness 内置约束

# ========================================
# 自定义约束示例
# ========================================

custom_constraints:
  # 示例 1：禁止 console.log
  # my_project_no_console_log:
  #   id: my_project_no_console_log
  #   level: guideline
  #   rule: "NO CONSOLE.LOG IN PRODUCTION CODE"
  #   message: "生产代码禁止使用 console.log，请使用 logger 模块"
  #   trigger: ["code_implementation"]
  #   description: "使用项目统一的 logger 模块代替 console.log"

  # 示例 2：禁止特定的导入
  # my_project_no_moment_js:
  #   id: my_project_no_moment_js
  #   level: guideline
  #   rule: "NO MOMENT.JS IMPORTS"
  #   message: "禁止使用 moment.js，请使用 date-fns 或 dayjs"
  #   trigger: ["code_implementation"]
  #   exceptions: ["legacy_migration"]

  # 示例 3：要求特定的文件命名
  # my_project_component_naming:
  #   id: my_project_component_naming
  #   level: tip
  #   rule: "REACT COMPONENTS SHOULD BE PASCAL CASE"
  #   message: "React 组件文件名应使用 PascalCase"
  #   trigger: ["file_creation"]

# ========================================
# 扩展内置约束的例外
# ========================================

# 如果需要为内置约束添加项目特定的例外，
# 可以在 .harness/config.yml 中配置：

# constraints:
#   no_fix_without_root_cause:
#     # 添加项目特定的例外
#     exceptions:
#       - my_custom_exception
`;

  await fs.writeFile(customConstraintsPath, content, 'utf-8');
  console.log(chalk.green(`✅ 已创建自定义约束示例: custom-constraints.yml`));
}
