# Claude PR Analysis Tool

A TypeScript CLI tool that integrates GitHub pull requests with Jira tickets using Claude AI for intelligent code analysis and automated PR feedback.

## 🚀 Quick Start

### Prerequisites
- Node.js (>=16.0.0)
- GitHub CLI (`gh`) - authenticated
- Jira CLI (`jira`) - authenticated

### Environment Setup
```bash
export JIRA_TICKET_PREFIX=YOUR_PROJECT    # e.g., RIZDEV, TEST, PROJECT
export GITHUB_REPOSITORY=owner/repo       # e.g., myorg/myproject
```

### Installation & Usage
```bash
# Clone and install
git clone https://github.com/your-org/claude-pr-analisys.git
cd claude-pr-analisys
npm install

# Analyze a pull request
npm run start 123                          # Generates temp/claude-prompt-[timestamp].txt
# Run Claude AI on the generated prompt
npm run start:comment 123 analysis.txt    # Posts results as PR comment
```

## 🛠️ Developer Instructions

### Development Workflow
```bash
npm run build          # Build TypeScript to JavaScript
npm run build:watch    # Build in watch mode for development
npm run clean          # Clean dist and temp directories
```

### Code Quality (Required Before Commits)
```bash
npm test               # Run all tests (must pass)
npm run lint           # ESLint validation (0 errors/warnings required)
npm run typecheck      # TypeScript strict validation  
npm run format         # Format code with Prettier
```

### Testing
```bash
# Set test environment
export JIRA_TICKET_PREFIX=TEST
export GITHUB_REPOSITORY=test-org/test-repo

# Run test suites
npm test                # All tests (recommended)
npm run test:watch      # Watch mode
npm run test:coverage   # With coverage reports
```

### Making Changes
1. **Follow Architecture**: Organize code by service boundaries (`src/services/github/`, `src/services/jira/`, etc.)
2. **Keep Files Small**: Target 100-200 lines per file maximum
3. **Add Tests**: All new features require Vitest tests with proper mocking
4. **Quality Gates**: All tests, lint, and type checks must pass before commits
5. **Static Data**: Extract constants to separate `constants.ts` files

### Project Structure
```
src/
├── analyze-pr.ts              # Main analysis script
├── comment-pr.ts              # Comment posting script  
├── core/                      # Configuration, errors, environment
├── services/                  # External integrations (GitHub, Jira, Claude)
├── testing/                   # Test infrastructure and mocks
├── utils/                     # Shared utilities
└── tests/                     # Test suites
```

### Key Patterns
- **CLI Integration**: Heavy use of `gh` and `jira` CLI tools
- **Dependency Injection**: Mock CLI commands for testing via `pr-utils.setDependencies()`
- **File-based Workflow**: Analysis prompts saved to `temp/` for manual review
- **Jira Pattern Matching**: Extracts tickets from PR titles using `JIRA_TICKET_PREFIX`

For detailed guidance, see `CLAUDE.md` and `.claude/CLAUDE.md`.