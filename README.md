# Claude PR Analysis Tool

A powerful TypeScript CLI tool that integrates GitHub pull requests with Jira tickets using Claude AI for intelligent code analysis and automated PR feedback.

## 🚀 Features

- **Intelligent PR Analysis**: Uses Claude AI to analyze pull request changes against Jira ticket requirements
- **GitHub Integration**: Seamless integration with GitHub CLI for PR data extraction and comment posting
- **Jira Integration**: Automatically extracts and validates Jira tickets from PR titles
- **Context-Aware Analysis**: Reads modified files and their dependencies for comprehensive code understanding
- **Automated Workflow**: Generate analysis prompts and post detailed feedback comments automatically
- **TypeScript Support**: Fully typed codebase with strict TypeScript configuration
- **Comprehensive Testing**: Extensive test suite with mock data and dependency injection
- **Code Quality**: ESLint + Prettier integration with pre-commit hooks

## 📋 Prerequisites

### Required CLI Tools
- **Node.js** (>=16.0.0)
- **GitHub CLI** (`gh`) - must be authenticated
- **Jira CLI** (`jira`) - must be authenticated

### Environment Variables
```bash
export JIRA_TICKET_PREFIX=YOUR_PROJECT    # e.g., RIZDEV, TEST, PROJECT
export GITHUB_REPOSITORY=owner/repo       # e.g., myorg/myproject
```

### Optional Environment Variables
```bash
export JIRA_TICKET_PATTERN="CUSTOM-\\d+"  # Override default ticket pattern
```

## 🛠️ Installation

### Global Installation
```bash
npm install -g claude-pr-analisys
```

### Local Development
```bash
git clone https://github.com/your-org/claude-pr-analisys.git
cd claude-pr-analisys
npm install
npm run build
```

## 📖 Usage

### Basic Commands

#### Analyze a Pull Request
```bash
# Generate Claude analysis prompt for PR #123
analyze-pr 123

# Using npx (if not globally installed)
npx claude-pr-analisys analyze-pr 123
```

#### Post Analysis as Comment
```bash
# Post analysis from file to PR #123
comment-pr 123 path/to/analysis-output.txt

# Complete workflow example
analyze-pr 123                           # Generates temp/claude-prompt-[timestamp].txt
# Run Claude AI on the generated prompt
comment-pr 123 temp/claude-analysis.txt  # Posts results as PR comment
```

### Development Commands

#### Build and Development
```bash
npm run build          # Build TypeScript to JavaScript
npm run build:watch    # Build in watch mode
npm run clean          # Clean dist and temp directories
npm run start          # Build and run analyze-pr
npm run start:comment  # Build and run comment-pr
```

#### Code Quality
```bash
npm run lint           # Run ESLint
npm run lint:fix       # Fix auto-fixable ESLint issues
npm run format         # Format code with Prettier
npm run typecheck      # Run TypeScript type checking
npm run quality        # Run all quality checks (lint + format + typecheck)
```

#### Testing
```bash
npm test               # Run all tests
npm run test:analyze   # Run analyze-pr tests only
npm run test:comment   # Run comment-pr tests only
npm run test:utils     # Run pr-utils tests only
```

## 🏗️ Architecture

### Core Scripts
- **`analyze-pr.ts`** - Main analysis script that gathers PR and Jira data, creates Claude prompts
- **`comment-pr.ts`** - Comment posting script that takes analysis results and posts to GitHub

### Shared Utilities
- **`src/utils/pr-utils.ts`** - Centralized GitHub/Jira integration utilities with dependency injection
- **`src/utils/test-utils.ts`** - Comprehensive testing framework with mocking capabilities

### Service Integrations
- **`src/services/github/`** - GitHub API and CLI integration
- **`src/services/jira/`** - Jira API and CLI integration  
- **`src/services/claude/`** - Claude AI integration and prompt management

### Core Infrastructure
- **`src/core/`** - Configuration, error handling, and environment management
- **`src/testing/`** - Test helpers, mock data, and testing utilities

## 🔄 Workflow

### 1. PR Analysis (`analyze-pr`)
1. Validates PR number and GitHub repository access
2. Extracts Jira ticket ID from PR title (using `JIRA_TICKET_PREFIX`)
3. Gathers PR metadata, diff, and file changes via GitHub CLI
4. Validates and fetches Jira ticket details via Jira CLI
5. Creates comprehensive Claude prompt with context-gathering instructions
6. Saves prompt to `temp/claude-prompt-[timestamp].txt`

### 2. Comment Posting (`comment-pr`)
1. Validates PR number and output file existence
2. Reads Claude's analysis response from file
3. Posts formatted comment to GitHub PR via CLI
4. Includes interactive confirmation for safety

### 3. Data Flow
```
PR Title → Jira Ticket Extraction → PR Data Gathering → Jira Data Gathering
    ↓
Claude Prompt Generation → Manual Claude Analysis → Comment Posting
```

## 🧪 Testing

### Test Architecture
- **Custom Testing Framework**: `TestRunner`, `MockExecutor`, `MockReadline` classes
- **Dependency Injection**: Comprehensive mocking of CLI commands and user interactions
- **Isolated Execution**: Each test runs in isolation with proper cleanup
- **Pattern Matching**: Flexible command matching for robust test scenarios

### Test Files
```
src/analyze-pr.test.ts         # Main analyze-pr functionality (13 tests)
src/tests/analyze-pr.test.ts   # Integration tests (8 tests)
src/tests/comment-pr.test.ts   # Comment posting tests (15 tests)
src/tests/pr-utils.test.ts     # Shared utilities tests (20 tests)
```

### Running Tests
```bash
# Set up test environment
export JIRA_TICKET_PREFIX=TEST
export GITHUB_REPOSITORY=test-org/test-repo

# Run individual test suites
npm run test:analyze
npm run test:comment  
npm run test:utils

# Run all tests
npm test
```

## 🔧 Configuration

### TypeScript Configuration
- **Strict Mode**: Full TypeScript strict mode enabled
- **ES2020 Target**: Modern JavaScript features supported
- **Declaration Files**: Generated for library usage
- **Source Maps**: Full debugging support

### ESLint Configuration
- **TypeScript Integration**: `@typescript-eslint` with strict rules
- **Test File Overrides**: Relaxed rules for test files and mocks
- **Prettier Integration**: No conflicts with code formatting

### Environment Configuration
The tool adapts to different environments:
- **Test Environment**: Uses `TEST` prefix and mock data
- **Development**: Uses project-specific `JIRA_TICKET_PREFIX`
- **CI/CD**: Compact error reporting and automated validation

## 📁 Project Structure

```
claude-pr-analisys/
├── src/
│   ├── analyze-pr.ts              # Main analysis script
│   ├── comment-pr.ts              # Comment posting script
│   ├── core/                      # Core infrastructure
│   │   ├── config.ts              # Configuration management
│   │   ├── environment.ts         # Environment validation
│   │   ├── errors.ts              # Error handling
│   │   └── types.ts               # Core type definitions
│   ├── services/                  # External service integrations
│   │   ├── github/                # GitHub API/CLI integration
│   │   ├── jira/                  # Jira API/CLI integration
│   │   └── claude/                # Claude AI integration
│   ├── testing/                   # Testing infrastructure
│   │   ├── mocks/                 # Mock data and responses
│   │   └── utils/                 # Test helpers
│   ├── utils/                     # Shared utilities
│   │   ├── pr-utils.ts            # PR/Jira operations
│   │   └── test-utils.ts          # Testing framework
│   └── types/                     # Type definitions
├── dist/                          # Compiled JavaScript (generated)
├── temp/                          # Temporary files (generated)
├── .claude/CLAUDE.md              # Project instructions for Claude
├── package.json                   # Dependencies and scripts
├── tsconfig.json                  # TypeScript configuration
├── .eslintrc.js                   # ESLint configuration
└── .prettierrc                    # Prettier configuration
```

## 🤝 Contributing

### Development Setup
1. Fork and clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables
4. Run tests: `npm test`
5. Build: `npm run build`

### Code Quality Standards
- **TypeScript**: Strict mode with comprehensive typing
- **ESLint**: No errors allowed, warnings acceptable for complex integrations
- **Prettier**: Consistent code formatting
- **Testing**: All new features must include tests

### Pull Request Process
1. Create feature branch from `main`
2. Implement changes with tests
3. Run quality checks: `npm run quality`
4. Test against real PRs in development environment
5. Submit PR with clear description

## 📝 License

MIT License - see LICENSE file for details.

## 🆘 Troubleshooting

### Common Issues

#### CLI Authentication
```bash
# GitHub CLI setup
gh auth login

# Jira CLI setup  
jira auth login --server https://your-instance.atlassian.net
```

#### Environment Variables
```bash
# Check current environment
echo $JIRA_TICKET_PREFIX
echo $GITHUB_REPOSITORY

# Verify CLI tools
gh --version
jira version
which node && node --version
```

#### Build Issues
```bash
# Clean and rebuild
npm run clean
npm install
npm run build
```

#### Test Failures
```bash
# Set test environment
export JIRA_TICKET_PREFIX=TEST
export GITHUB_REPOSITORY=test-org/test-repo

# Run tests with debugging
npm test
```

### Support

- **Issues**: Report bugs and feature requests on GitHub Issues
- **Documentation**: See `.claude/CLAUDE.md` for detailed project instructions
- **Testing**: Comprehensive test suite provides usage examples

---

Built with ❤️ using TypeScript, Claude AI, and modern development practices.