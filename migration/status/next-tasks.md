# Next Tasks Queue

**Current Priority**: Complete Phase 2 - Mock Data Organization  
**Focus**: Service CLI mock responses and test integration  

## Immediate Next Tasks (Priority Order)

### 1. 🔄 Create Jira Service CLI Mock Responses [CURRENT]
**File**: `src/services/jira/mock-responses.js`  
**Estimated Time**: 30-45 minutes  
**Priority**: HIGH  

**Requirements**:
- Follow pattern from `src/services/github/mock-responses.js`
- Include command patterns for:
  - `jira version` - CLI version info
  - `jira me` - Authentication status
  - `jira issue view <ticket>` - Ticket details with dynamic ticket IDs
  - `jira issue list` - Issue listing
  - `jira init` - CLI initialization
- Error responses for common failure scenarios
- Dynamic response generation based on command parameters

**Dependencies**: GitHub service mock pattern (completed)  
**Success Criteria**: Service-specific mock responses with regex pattern matching

---

### 2. ⏳ Create Claude Service CLI Mock Responses [NEXT]
**File**: `src/services/claude/mock-responses.js`  
**Estimated Time**: 30-45 minutes  
**Priority**: HIGH  

**Requirements**:
- Follow established service mock pattern
- Include command patterns for:
  - `claude --version` - CLI version info  
  - `claude --help` - Help text
  - `claude < file` - Analysis execution (stdin input)
  - Authentication/config commands
- Mock analysis responses using existing mock data
- Error handling for authentication and execution failures

**Dependencies**: Jira service mock pattern  
**Success Criteria**: Complete CLI command coverage for Claude operations

---

### 3. ⏳ Create Mock Data Index Files [NEXT]
**Files**: 
- `src/testing/mocks/index.js`
- `src/services/github/index.js`  
- `src/services/jira/index.js`
- `src/services/claude/index.js`

**Estimated Time**: 20-30 minutes  
**Priority**: HIGH  

**Requirements**:
- Re-export all mock data for unified imports
- Provide convenience functions for test setup
- Service-specific exports for CLI responses
- Clean import interface for test files

**Dependencies**: All service mock responses completed  
**Success Criteria**: Single import location for all mock needs

## Medium Priority Tasks (After Immediate)

### 4. ⏳ Update Test Utilities
**File**: `src/utils/test-utils.js`  
**Estimated Time**: 45-60 minutes  
**Priority**: MEDIUM  

**Requirements**:
- Remove ~200 lines of inline mock data
- Import from new mock data files
- Add helper functions for test environment setup
- Maintain backward compatibility during transition

**Dependencies**: Mock data index files  
**Success Criteria**: Clean utilities file with external mock imports

### 5. ⏳ Update Test Files to Use Mock Imports
**Files**:
- `src/tests/analyze-pr.test.js`
- `src/tests/comment-pr.test.js`
- `src/tests/pr-utils.test.js`  
- `src/analyze-pr.test.js`

**Estimated Time**: 1-2 hours total  
**Priority**: MEDIUM  

**Requirements**:
- Replace inline mock data with imports from mock files
- Use centralized test setup functions
- Ensure all tests continue to pass
- Reduce test file lengths by 50-70%

**Dependencies**: Updated test utilities  
**Success Criteria**: All tests pass with cleaner, shorter test files

## Phase Completion Criteria

### Phase 2 Complete When:
- [ ] All 3 service CLI mock response files created
- [ ] Mock data index files provide clean import interface
- [ ] Test utilities use external mock files
- [ ] All 4 test files updated to use mock imports  
- [ ] All existing tests pass with new mock structure
- [ ] No inline mock data remaining (except small test-specific data)

### Next Phase Preparation
After Phase 2 completion, we'll be ready for:
- **Phase 3**: TypeScript service creation
- Service configuration files with proper typing
- CLI wrapper implementations with TypeScript
- Core configuration composition

## Update Schedule

**After each task completion**:
1. Mark task complete in this file
2. Update current-phase.md with new current task
3. Log file changes in tracking/file-changes.md
4. Update phase progress in phases/phase-2-mock-data.md

**After completing 2-3 tasks**:
- Full status review and documentation update
- Validate all tests still pass
- Check for any new blockers or dependencies

---
**Last Updated**: Current session  
**Next Review**: After completing Jira service mock responses