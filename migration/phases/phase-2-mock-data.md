# Phase 2: Mock Data Organization

**Status**: 🔄 **IN PROGRESS**  
**Started**: Current session  
**Current Task**: Create Jira service CLI mock responses  

## Overview

Organize mock data into service-specific files to improve test maintainability and prepare for TypeScript migration. Each service will own its mock data and CLI responses.

## Goals

- [ ] Extract inline mock data from test files into dedicated files
- [ ] Create service-specific CLI response mocks
- [ ] Organize mock data by service (GitHub, Jira, Claude)
- [ ] Update test utilities to use centralized mocks
- [ ] Ensure all mocks respect environment variables (no hardcoded values)

## Progress Tracking

### ✅ Mock Data Files Created
- [x] **`src/testing/mocks/github-data.js`**
  - Dynamic GitHub PR mock data using `getTestTicketId()`
  - Mock PR view, diff, and JSON responses
  - Environment-aware ticket ID generation

- [x] **`src/testing/mocks/jira-data.js`**  
  - Dynamic Jira ticket mock data using `getTestTicketId()`
  - Mock issue content and metadata
  - Test patterns for validation testing

- [x] **`src/testing/mocks/claude-data.js`**
  - Dynamic Claude prompt and response generation
  - Mock analysis results using environment ticket IDs
  - Prompt templates and response variations

### 🔄 Service CLI Response Mocks (In Progress)
- [x] **`src/services/github/mock-responses.js`**
  - GitHub CLI command patterns and responses
  - Dynamic response generation based on PR numbers
  - Error response handling

- [ ] **`src/services/jira/mock-responses.js`** ← **CURRENT TASK**
  - Jira CLI command patterns and responses  
  - Dynamic ticket ID handling
  - Issue view, list, and management responses

- [ ] **`src/services/claude/mock-responses.js`**
  - Claude CLI command patterns and responses
  - Analysis command mocking
  - Version and help command responses

### ⏳ Integration Tasks (Pending)
- [ ] **Create mock data index files**
  - `src/testing/mocks/index.js` - Unified mock exports
  - Service-specific index files for easy importing

- [ ] **Update test utilities**
  - Modify `src/utils/test-utils.js` to import from mock files
  - Remove ~200+ lines of inline mock data
  - Add centralized test setup functions

- [ ] **Update all test files**
  - `src/tests/analyze-pr.test.js`
  - `src/tests/comment-pr.test.js`  
  - `src/tests/pr-utils.test.js`
  - `src/analyze-pr.test.js`
  - Replace inline mocks with clean imports

## Task Details

### Current Task: Jira Service CLI Mock Responses

**File**: `src/services/jira/mock-responses.js`

**Requirements**:
- Follow pattern established in GitHub service
- Include command patterns for:
  - `jira version` - Version information
  - `jira me` - User authentication status
  - `jira issue view <ticket>` - Ticket details
  - `jira issue list` - Issue listing
  - `jira init` - CLI initialization

**Pattern**:
```javascript
const jiraCLIResponses = {
    version: { stdout: 'Version: 1.4.0' },
    issueView: (ticketId) => ({ stdout: getMockJiraData(ticketId) }),
    // ... other responses
};

function getJiraMockResponse(command) {
    // Pattern matching and dynamic response generation
}
```

### ✅ Completed: Claude Service CLI Mock Responses

**File**: `src/services/claude/mock-responses.js` ✅ **COMPLETE**

**Completed Requirements**:
- ✅ Claude CLI command patterns for version, help, analysis, auth, config
- ✅ Dynamic analysis response generation using environment variables
- ✅ Error handling for various Claude CLI failure scenarios
- ✅ Pattern matching for different command types including stdin redirection

## Directory Structure Progress

```
src/
├── services/
│   ├── github/
│   │   ├── config.ts           # ✅ Created (previous work)
│   │   ├── types.ts            # ✅ Created (previous work)
│   │   ├── mock-responses.js   # ✅ Complete
│   │   └── tests/
│   ├── jira/
│   │   ├── config.ts           # ✅ Created (previous work)
│   │   ├── types.ts            # ✅ Created (previous work)
│   │   ├── mock-responses.js   # ✅ Complete
│   │   ├── index.js            # ✅ Complete
│   │   └── tests/
│   └── claude/
│       ├── mock-responses.js   # ✅ Complete
│       ├── index.js            # ✅ Complete
│       └── tests/
├── testing/
│   ├── mocks/
│   │   ├── github-data.js      # ✅ Complete
│   │   ├── jira-data.js        # ✅ Complete
│   │   ├── claude-data.js      # ✅ Complete
│   │   └── index.js           # ✅ Complete
│   └── utils/
│       └── test-helpers.js     # ✅ Complete
```

## Benefits Achieved So Far

### Test File Cleanup Preparation
- Current test files have 100-200 lines of inline mock data each
- New structure will reduce test files to ~50-100 lines of actual test logic
- Easier to understand what tests are actually testing

### Service Isolation
- Each service owns its mock responses
- No shared CLI response files
- Clear boundaries between service concerns

### Environment Awareness
- All mock data respects `JIRA_TICKET_PREFIX`
- No hardcoded ticket IDs anywhere
- Dynamic generation based on test environment

## ✅ Success Criteria for Phase 2 - COMPLETE

- [x] All service CLI mock response files created and functional
- [x] Shared test utilities consolidated with getTestTicketId() refactoring
- [x] Test utilities updated to use mock imports instead of inline data
- [x] All existing tests updated to use new mock structure
- [x] Mock data index files provide clean import interface
- [x] Service-specific index files created for organized exports

## ✅ Completed Work Summary

- **✅ GitHub service mocks**: Complete with CLI response patterns
- **✅ Jira service mocks**: Complete with dynamic ticket handling  
- **✅ Claude service mocks**: Complete with analysis generation
- **✅ Shared test utilities**: Refactored getTestTicketId() into test-helpers.js
- **✅ Index files**: Created unified and service-specific exports
- **✅ Test utilities update**: Updated to use shared mock system
- **✅ Test file updates**: All 4 test files updated with clean imports

**Total**: 7 major tasks completed in Phase 2

## 🎯 Phase 2 Results

### Code Quality Improvements
- **300+ lines of duplicate mock data eliminated** from test files
- **Single source of truth** for all test utilities and mock data
- **Environment-aware testing** with dynamic ticket ID generation
- **Service isolation** maintained with clear boundaries

### Development Experience Improvements  
- **Clean imports** across all test files using shared utilities
- **Consistent CLI mocking** patterns across all services
- **Easy test setup** with shared environment management functions
- **Realistic mock data** that matches actual CLI tool responses

---
**Status**: ✅ **PHASE 2 COMPLETE**  
**Next Phase**: Phase 3 - TypeScript Service Creation