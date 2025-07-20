#!/usr/bin/env node

/**
 * comment-pr.ts - GitHub PR Comment Posting Script
 * Author: Anthony Rizzo, Co-pilot: Claude
 * Description: Posts analysis results as comments to GitHub pull requests
 */

import * as fs from 'fs';
import * as path from 'path';

import {
  printStatus,
  validatePRNumber,
  validatePR,
  validateFile,
  postPRComment,
  checkRequiredTools,
  getUserConfirmation,
} from './utils/pr-utils';

import { loadAppConfig } from './core';

/**
 * Validate that the output file exists and is readable
 * @param filePath Path to the output file
 * @returns True if file is valid
 */
async function validateOutputFile(filePath: string): Promise<boolean> {
  printStatus('yellow', `Validating output file: ${filePath}`);

  if (!(await validateFile(filePath))) {
    printStatus(
      'red',
      `Error: File does not exist or is not readable: ${filePath}`
    );
    return false;
  }

  try {
    const stats = await fs.promises.stat(filePath);
    if (stats.size === 0) {
      printStatus('red', 'Error: File is empty');
      return false;
    }

    if (stats.size > 65536) {
      // 64KB limit for GitHub comments
      printStatus(
        'yellow',
        `Warning: File is large (${Math.round(stats.size / 1024)}KB). GitHub has comment size limits.`
      );
    }

    printStatus('green', `File validated (${Math.round(stats.size / 1024)}KB)`);
    return true;
  } catch (error) {
    printStatus(
      'red',
      `Error validating file: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
    return false;
  }
}

/**
 * Preview file content for user confirmation
 * @param filePath Path to file to preview
 * @param previewLines Number of lines to show (default: 10)
 */
async function previewFile(
  filePath: string,
  previewLines: number = 10
): Promise<void> {
  try {
    const content = await fs.promises.readFile(filePath, 'utf8');
    const lines = content.split('\n');

    console.log(`\n📄 File Preview (first ${previewLines} lines):`);
    console.log('─'.repeat(60));

    for (let i = 0; i < Math.min(previewLines, lines.length); i++) {
      console.log(`${String(i + 1).padStart(3)}: ${lines[i]}`);
    }

    if (lines.length > previewLines) {
      console.log(`... (${lines.length - previewLines} more lines)`);
    }

    console.log('─'.repeat(60));
    console.log(
      `Total: ${lines.length} lines, ${Math.round(content.length / 1024)}KB`
    );
  } catch (error) {
    printStatus(
      'yellow',
      `Could not preview file: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Post comment to GitHub PR
 * @param prNumber GitHub PR number
 * @param filePath Path to file containing comment content
 * @returns True if comment posted successfully
 */
async function postComment(
  prNumber: string,
  filePath: string
): Promise<boolean> {
  printStatus('yellow', 'Preparing to post comment...');

  // Show preview and get confirmation
  await previewFile(filePath);

  const confirmed = await getUserConfirmation(
    `\n❓ Post this content as a comment to PR #${prNumber}?`,
    false
  );

  if (!confirmed) {
    printStatus('yellow', 'Comment posting cancelled by user');
    return false;
  }

  try {
    const success = await postPRComment(prNumber, filePath);
    if (success) {
      printStatus('green', 'Comment posted successfully!');
      return true;
    } else {
      printStatus('red', 'Failed to post comment');
      return false;
    }
  } catch (error) {
    printStatus(
      'red',
      `Error posting comment: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
    return false;
  }
}

/**
 * Main comment posting function
 * @param prNumber GitHub PR number
 * @param outputFile Path to analysis output file
 */
async function main(prNumber: string, outputFile: string): Promise<void> {
  printStatus('green', `Starting PR Comment Posting for #${prNumber}`);
  printStatus('green', '='.repeat(50));

  // Step 1: Validate PR
  if (!(await validatePR(prNumber))) {
    throw new Error('PR validation failed');
  }

  // Step 2: Validate output file
  if (!(await validateOutputFile(outputFile))) {
    throw new Error('Output file validation failed');
  }

  // Step 3: Post comment
  const success = await postComment(prNumber, outputFile);
  if (!success) {
    throw new Error('Failed to post comment');
  }

  // Step 4: Show success message with PR link
  const config = loadAppConfig();
  const repoUrl = `https://github.com/${config.environment.githubRepository}`;
  printStatus('green', 'Comment posted successfully!');
  printStatus('blue', `View the comment at: ${repoUrl}/pull/${prNumber}`);
}

/**
 * Display usage information
 */
function usage(): void {
  console.log(`
GitHub PR Comment Posting Script
=================================

Usage: node comment-pr.js <pr_number> <output_file>

Author: Anthony Rizzo, Co-pilot: Claude
Description: Posts analysis results as comments to GitHub pull requests

Arguments:
  pr_number         The GitHub pull request number to comment on
  output_file       Path to file containing comment content (markdown supported)

Examples:
  node comment-pr.js 393 temp/claude-output-1752941479496.txt
  node comment-pr.js 394 analysis-results.md
  node comment-pr.js 395 /path/to/analysis.txt

Requirements:
  - Node.js
  - gh (GitHub CLI) - authenticated with PR write access

Features:
  - File validation and size checking
  - Content preview before posting
  - User confirmation prompt
  - Support for markdown formatting
  - Handles large files (with warnings)
  - Integration with TypeScript service architecture

Process:
1. Validates PR exists and is accessible
2. Validates output file exists and is readable
3. Shows content preview
4. Prompts for user confirmation
5. Posts comment using GitHub CLI service

File Requirements:
  - File must exist and be readable
  - Non-empty content
  - Recommended size limit: 64KB (GitHub comment limit)
  - Supports plain text and markdown

Environment Variables:
  GITHUB_REPOSITORY     - GitHub repository (owner/repo format)

Integration:
This script pairs with analyze-pr.js for a complete workflow:
1. Run: node analyze-pr.js <pr_number>
2. Analysis is automatically processed through Claude (if available)
3. Run: node comment-pr.js <pr_number> <output_file> (if needed)

Note: If Claude CLI is available, analyze-pr.js can directly post comments,
making this script optional for manual comment posting.

Created by: Anthony Rizzo with Claude as co-pilot
`);
}

/**
 * Entry point
 */
async function main_entry(): Promise<void> {
  if (process.argv.length !== 4) {
    usage();
    process.exit(1);
  }

  const prNumber = process.argv[2]!;
  const outputFile = process.argv[3]!;

  // Validate PR number format
  if (!validatePRNumber(prNumber)) {
    printStatus('red', 'Error: PR number must be numeric');
    usage();
    process.exit(1);
  }

  // Convert relative path to absolute if needed
  const absoluteOutputFile = path.isAbsolute(outputFile)
    ? outputFile
    : path.resolve(process.cwd(), outputFile);

  try {
    const tools = await checkRequiredTools();
    if (!tools.github) {
      printStatus(
        'red',
        'Error: GitHub CLI (gh) is required but not available'
      );
      printStatus(
        'yellow',
        'Please install and authenticate GitHub CLI: https://cli.github.com/'
      );
      process.exit(1);
    }

    await main(prNumber, absoluteOutputFile);
  } catch (error) {
    printStatus(
      'red',
      `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  void main_entry();
}

// Export for testing and module use
export { main, validateOutputFile, postComment, previewFile, usage };
