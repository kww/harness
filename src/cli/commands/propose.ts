/**
 * Propose CLI 命令
 *
 * 根据诊断生成约束提案
 */

import * as fs from 'fs';
import * as path from 'path';
import { ConstraintEvolver, createEvolver } from '../../monitoring/constraint-evolver';
import { ConstraintDoctor, createDoctor } from '../../monitoring/constraint-doctor';
import type { ConstraintProposal } from '../../monitoring/constraint-evolver';
import type { Diagnosis } from '../../monitoring/constraint-doctor';

/**
 * propose 命令
 */
export async function proposeCommand(
  subcommand: string,
  options: {
    diagnosisId?: string;
    format?: 'json' | 'text';
    save?: boolean;
    status?: 'proposed' | 'accepted' | 'rejected';
    accept?: boolean;
    reject?: boolean;
    comment?: string;
  }
): Promise<void> {
  switch (subcommand) {
    case 'generate':
      await generateProposal(options);
      break;

    case 'list':
      await listProposals(options);
      break;

    case 'show':
      await showProposal(options);
      break;

    case 'review':
      await reviewProposal(options);
      break;

    case 'implement':
      await implementProposal(options);
      break;

    default:
      console.log('Usage: harness propose <subcommand>');
      console.log('');
      console.log('Subcommands:');
      console.log('  generate  Generate proposals from diagnoses');
      console.log('  list      List all proposals');
      console.log('  show      Show a specific proposal');
      console.log('  review    Review a proposal (accept/reject)');
      console.log('  implement Show implementation instructions');
      console.log('');
      console.log('Options:');
      console.log('  --diagnosis <id>  Generate from specific diagnosis');
      console.log('  --status <status> Filter by status');
      console.log('  --accept          Accept proposal (for review)');
      console.log('  --reject          Reject proposal (for review)');
      console.log('  --comment <text>  Review comment');
      console.log('  --format <format> Output format');
      console.log('  --save            Save to file');
  }
}

/**
 * 生成提案
 */
async function generateProposal(options: {
  diagnosisId?: string;
  format?: 'json' | 'text';
  save?: boolean;
}): Promise<void> {
  const evolver = createEvolver();
  const doctor = createDoctor();

  // 加载诊断
  let diagnoses: Diagnosis[] = [];

  if (options.diagnosisId) {
    const diagnosisPath = `.harness/diagnoses/${options.diagnosisId}.json`;
    if (!fs.existsSync(diagnosisPath)) {
      console.log(`❌ Diagnosis not found: ${options.diagnosisId}`);
      return;
    }
    diagnoses = [doctor.loadDiagnosis(diagnosisPath)];
  } else {
    // 加载所有诊断
    const diagnosesDir = '.harness/diagnoses';
    if (fs.existsSync(diagnosesDir)) {
      const files = fs.readdirSync(diagnosesDir).filter(f => f.endsWith('.json'));
      diagnoses = files.map(f => {
        const content = fs.readFileSync(path.join(diagnosesDir, f), 'utf-8');
        return JSON.parse(content) as Diagnosis;
      });
    }
  }

  // 过滤需要变更的诊断
  const needsChangeDiagnoses = diagnoses.filter(d => d.needsChange);

  if (needsChangeDiagnoses.length === 0) {
    console.log('✅ No diagnoses need constraint changes. No proposals to generate.');
    return;
  }

  console.log(`💡 Generating proposals from ${needsChangeDiagnoses.length} diagnoses...`);
  console.log('');

  // 生成提案
  const proposals = await evolver.proposeBatch(needsChangeDiagnoses);

  if (options.format === 'json') {
    console.log(JSON.stringify(proposals, null, 2));
  } else {
    for (const proposal of proposals) {
      printProposalSummary(proposal);
      console.log('---');
    }
  }

  // 保存
  if (options.save) {
    for (const proposal of proposals) {
      evolver.saveProposal(proposal);
    }
    console.log('');
    console.log(`💾 Saved ${proposals.length} proposals to .harness/proposals/`);
  }
}

/**
 * 列出提案
 */
async function listProposals(options: {
  status?: 'proposed' | 'accepted' | 'rejected';
  format?: 'json' | 'text';
}): Promise<void> {
  const evolver = createEvolver();
  const proposals = evolver.listProposals(options.status);

  if (proposals.length === 0) {
    console.log('❌ No proposals found.');
    return;
  }

  if (options.format === 'json') {
    console.log(JSON.stringify(proposals.map(p => ({
      id: p.id,
      constraintId: p.constraintId,
      type: p.type,
      status: p.status,
      risk: p.risk.level,
    })), null, 2));
  } else {
    console.log('📋 Proposal List');
    console.log('');

    for (const proposal of proposals) {
      const statusEmoji = {
        proposed: '💡',
        reviewing: '🔍',
        accepted: '✅',
        rejected: '❌',
        implemented: '🎉',
      }[proposal.status];

      const riskEmoji = {
        low: '🟢',
        medium: '🟡',
        high: '🔴',
      }[proposal.risk.level];

      console.log(`${statusEmoji} ${proposal.id}`);
      console.log(`   Constraint: ${proposal.constraintId}`);
      console.log(`   Type: ${proposal.type}`);
      console.log(`   Risk: ${riskEmoji} ${proposal.risk.level}`);
      console.log('');
    }

    console.log(`Total: ${proposals.length} proposals`);
  }
}

/**
 * 显示提案详情
 */
async function showProposal(options: {
  diagnosisId?: string;
  format?: 'json' | 'text';
}): Promise<void> {
  if (!options.diagnosisId) {
    console.log('❌ Please specify --diagnosis <id>');
    return;
  }

  // 尝试通过诊断 ID 找到提案
  const evolver = createEvolver();
  const proposals = evolver.listProposals();
  const proposal = proposals.find(p => p.diagnosisId === options.diagnosisId);

  if (!proposal) {
    console.log(`❌ Proposal not found for diagnosis: ${options.diagnosisId}`);
    return;
  }

  if (options.format === 'json') {
    console.log(JSON.stringify(proposal, null, 2));
  } else {
    printProposalDetail(proposal);
  }
}

/**
 * 审核提案
 */
async function reviewProposal(options: {
  diagnosisId?: string;
  accept?: boolean;
  reject?: boolean;
  comment?: string;
}): Promise<void> {
  if (!options.diagnosisId) {
    console.log('❌ Please specify --diagnosis <id>');
    return;
  }

  if (!options.accept && !options.reject) {
    console.log('❌ Please specify --accept or --reject');
    return;
  }

  const evolver = createEvolver();
  const proposals = evolver.listProposals();
  const proposal = proposals.find(p => p.diagnosisId === options.diagnosisId);

  if (!proposal) {
    console.log(`❌ Proposal not found for diagnosis: ${options.diagnosisId}`);
    return;
  }

  // 更新状态
  const status = options.accept ? 'accepted' : 'rejected';
  evolver.updateProposalStatus(proposal.id, status, options.comment);

  console.log(`${options.accept ? '✅ Accepted' : '❌ Rejected'} proposal ${proposal.id}`);
  if (options.comment) {
    console.log(`Comment: ${options.comment}`);
  }
}

/**
 * 显示实施指导
 */
async function implementProposal(options: {
  diagnosisId?: string;
}): Promise<void> {
  if (!options.diagnosisId) {
    console.log('❌ Please specify --diagnosis <id>');
    return;
  }

  const evolver = createEvolver();
  const proposals = evolver.listProposals('accepted');
  const proposal = proposals.find(p => p.diagnosisId === options.diagnosisId);

  if (!proposal) {
    console.log(`❌ No accepted proposal found for diagnosis: ${options.diagnosisId}`);
    return;
  }

  const implementation = evolver.implement(proposal);

  console.log('🔧 Implementation Instructions');
  console.log('');
  console.log(`Proposal: ${proposal.id}`);
  console.log(`Constraint: ${proposal.constraintId}`);
  console.log(`Type: ${proposal.type}`);
  console.log('');

  console.log('**Steps**:');
  for (const instruction of implementation.instructions) {
    console.log(`- ${instruction}`);
  }
  console.log('');

  console.log('**Files to Modify**:');
  for (const file of implementation.filesToModify) {
    console.log(`- ${file}`);
  }
  console.log('');

  console.log('**Tests to Run**:');
  for (const test of implementation.testsToRun) {
    console.log(`- ${test}`);
  }
}

/**
 * 打印提案摘要
 */
function printProposalSummary(proposal: ConstraintProposal): void {
  const statusEmoji: string = {
    proposed: '💡',
    reviewing: '🔍',
    accepted: '✅',
    rejected: '❌',
    implemented: '🎉',
  }[proposal.status] || '❓';

  console.log(`${statusEmoji} Proposal: ${proposal.id}`);
  console.log(`Constraint: ${proposal.constraintId}`);
  console.log(`Type: ${proposal.type}`);
  console.log(`Description: ${proposal.content.description}`);
  console.log(`Risk: ${proposal.risk.level}`);
  console.log(`Expected: ${proposal.expectedOutcome}`);
}

/**
 * 打印提案详情
 */
function printProposalDetail(proposal: ConstraintProposal): void {
  console.log(`# Proposal: ${proposal.id}`);
  console.log('');
  console.log(`- **Constraint**: ${proposal.constraintId}`);
  console.log(`- **Type**: ${proposal.type}`);
  console.log(`- **Status**: ${proposal.status}`);
  console.log(`- **Proposed**: ${new Date(proposal.proposedAt).toISOString()}`);
  console.log('');

  console.log(`## Content`);
  console.log('');
  console.log(`**Description**: ${proposal.content.description}`);
  if (proposal.content.current) {
    console.log(`**Current**: ${JSON.stringify(proposal.content.current)}`);
  }
  console.log(`**Proposed**: ${JSON.stringify(proposal.content.proposed)}`);
  console.log('');

  console.log(`## Reasoning`);
  console.log('');
  console.log(proposal.reasoning);
  console.log('');

  console.log(`## Expected Outcome`);
  console.log('');
  console.log(proposal.expectedOutcome);
  console.log('');

  console.log(`## Risk Assessment`);
  console.log('');
  console.log(`- **Level**: ${proposal.risk.level}`);
  console.log(`- **Description**: ${proposal.risk.description}`);
  if (proposal.risk.rollbackPlan) {
    console.log(`- **Rollback**: ${proposal.risk.rollbackPlan}`);
  }

  if (proposal.reviewComment) {
    console.log('');
    console.log(`## Review Comment`);
    console.log('');
    console.log(proposal.reviewComment);
  }
}