/**
 * 配置管理
 */

import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';

// 加载 .env 文件（从项目根目录）
const envPath = path.join(__dirname, '../../.env');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
}

export interface Config {
  // 路径配置
  skillsPath: string;
  stepsPath: string;   // 原子步骤路径
  
  // API 配置
  codingApiKey?: string;
  anthropicApiKey?: string;
  anthropicBaseUrl?: string;
  anthropicModel?: string;
  
  // 执行配置
  defaultTimeout: number;
  maxRetries: number;
  retryDelay: number;
  
  // 工作目录
  workdir: string;
  outputsDir: string;
  
  // Agent 路径
  codexPath?: string;
  claudePath?: string;
}

const DEFAULT_CONFIG: Partial<Config> = {
  defaultTimeout: 60000,
  maxRetries: 3,
  retryDelay: 5000,
};

/**
 * 加载配置
 */
export function loadConfig(): Config {
  const skillsPath = process.env.AGENT_WORKFLOWS_PATH || 
                     process.env.AGENT_SKILLS_PATH ||  // 向后兼容
                     path.join(os.homedir(), 'projects', 'agent-workflows');
  
  const stepsPath = process.env.AGENT_STEPS_PATH || 
                    path.join(skillsPath, 'steps');
  
  return {
    // 路径配置
    skillsPath,
    stepsPath,
    
    // API 配置
    codingApiKey: process.env.CODING_API_KEY_1,
    anthropicApiKey: process.env.ANTHROPIC_API_KEY_1 || process.env.ANTHROPIC_API_KEY,
    anthropicBaseUrl: process.env.ANTHROPIC_BASE_URL,
    anthropicModel: process.env.ANTHROPIC_MODEL,
    
    // 执行配置
    defaultTimeout: parseInt(process.env.DEFAULT_TIMEOUT || '', 10) || DEFAULT_CONFIG.defaultTimeout!,
    maxRetries: parseInt(process.env.MAX_RETRIES || '', 10) || DEFAULT_CONFIG.maxRetries!,
    retryDelay: parseInt(process.env.RETRY_DELAY || '', 10) || DEFAULT_CONFIG.retryDelay!,
    
    // 工作目录（默认 /tmp/agent-runtime，避免污染项目目录）
    workdir: process.env.WORKDIR || path.join(os.tmpdir(), 'agent-runtime'),
    outputsDir: process.env.OUTPUTS_DIR || path.join(os.homedir(), 'outputs'),
    
    // Agent 路径
    codexPath: process.env.CODEX_PATH || 'codex',
    claudePath: process.env.CLAUDE_PATH || 'claude',
  };
}

// 全局配置实例
export const config = loadConfig();
