---
description: 'Guidelines for creating unit tests in ServiceNow using Jasmine framework'
applyTo: '**/*Test.script.js'
---

# ServiceNow Unit Testing Guidelines

## Overview

This document provides guidelines for creating unit tests in ServiceNow using the Jasmine testing framework. Tests are implemented as Script Includes and follow specific naming and structural conventions.

## Testing Framework

- **Framework:** Jasmine (https://jasmine.github.io/)
- **Random Data Generation:** Chance.js (https://chancejs.com/)
- **Test Helper:** `KLF_TestUtils` for data cleanup and randomization

## Naming Conventions

### Test Script Include Naming

When testing a Script Include, create a test Script Include with the suffix `Test`:

- **Script Include:** `KLF_RecordSync_GroupUtils`
- **Test Script Include:** `KLF_RecordSync_GroupUtilsTest`

### Test Structure

```javascript
function KLF_YourScriptIncludeTest() {
    describe('KLF_YourScriptInclude', function() {
        /** @type {global.KLF_TestUtils} */
        var testUtils;
        
        beforeEach(function() {
            testUtils = new global.KLF_TestUtils();
        });
        
        afterEach(function() {
            testUtils.cleanup();
        });
        
        describe('methodName()', function() {
            it('should perform expected behavior', function() {
                // Test implementation
            });
        });
    });
}
```

## Required JSDoc Type Annotations

All test code must include comprehensive JSDoc type annotations:

```javascript
/** @type {global.KLF_TestUtils} */
var testUtils;

/** @type {GlideRecord} */
var record;

/** @type {string[]} */
var ids;

/**
 * @param {string} name
 * @param {number} count
 * @returns {GlideRecord[]}
 */
function createTestRecords(name, count) {
    // Implementation
}
```

## Using KLF_TestUtils

### Initialization

Always initialize `KLF_TestUtils` in `beforeEach()` and clean up in `afterEach()`:

```javascript
describe('YourTest', function() {
    /** @type {global.KLF_TestUtils} */
    var testUtils;
    
    beforeEach(function() {
        testUtils = new global.KLF_TestUtils();
    });
    
    afterEach(function() {
        testUtils.cleanup();
    });
});
```

### Tracking Records for Cleanup

Track any records created during tests to ensure automatic cleanup:

```javascript
// Track by GlideRecord
var user = testUtils.createUser(testUtils.getRandomUsername());
// No need to manually track - createUser does it automatically

// Track custom records manually
var notification = new GlideRecord('sysevent_email_action');
notification.newRecord();
notification.name = 'test_notification';
notification.update();
testUtils.recordTracker.trackByGlideRecord(notification);

// Track by sys_id and table name
testUtils.recordTracker.trackBySysId(sysId, 'sys_user');
```

### Creating Test Data

Use `KLF_TestUtils` methods to create common test data:

```javascript
// Create users
var user = testUtils.createUser(testUtils.getRandomUsername());
var adminUser = testUtils.createAdminUser();

// Create groups
var group = testUtils.createGroup(testUtils.getRandomGroupName());

// Create roles
var role = testUtils.createRole('test_role');

// Add users to groups
var groupMember = testUtils.addUserToGroup(group, user);

// Add roles to users
var userHasRole = testUtils.addRoleToUser(user, 'admin');

// Add roles to groups
var groupHasRole = testUtils.addRoleToGroup(group, 'admin');
```

### Generating Random Data

Use the `chance` property for random data generation:

```javascript
// Generate random alphanumeric string
var randomString = testUtils.getRandomAlphaNumericString(10);

// Generate random username
var username = testUtils.getRandomUsername();

// Generate random group name
var groupName = testUtils.getRandomGroupName();

// Use chance directly for more options
var randomEmail = testUtils.chance.email();
var randomNumber = testUtils.chance.integer({ min: 1, max: 100 });
var randomBoolean = testUtils.chance.bool();
```

### Impersonating Users

Test functionality that requires specific user contexts:

```javascript
// Run code as a specific user
testUtils.runAsUser(userSysId, function() {
    // Code runs as the specified user
});

// Run code as common user (no roles/groups)
testUtils.runAsCommonUser(function() {
    // Code runs as common user
});

// Manual impersonation
var previousUserSysId = testUtils.impersonateUser(userSysId);
// Do work as impersonated user
testUtils.impersonateUser(previousUserSysId); // Revert
```

## Test Organization

### Describe Blocks

Use nested `describe()` blocks for logical organization:

```javascript
function KLF_YourScriptIncludeTest() {
    describe('KLF_YourScriptInclude', function() {
        
        describe('methodName()', function() {
            it('should handle valid input', function() {
                // Test case
            });
            
            it('should throw error on invalid input', function() {
                // Test case
            });
            
            it('should return expected result', function() {
                // Test case
            });
        });
        
        describe('anotherMethod()', function() {
            it('should perform expected behavior', function() {
                // Test case
            });
        });
    });
}
```

### Test Case Naming

Use descriptive `it()` statements that clearly express expected behavior:

```javascript
// ✅ Good - Clear and descriptive
it('should return the unique groups in the specified table', function() { });
it('should throw error if table name does not exist', function() { });
it('should update the notifications using the group mapping', function() { });

// ❌ Bad - Vague or unclear
it('should work', function() { });
it('test method', function() { });
```

## Jasmine Matchers

### Standard Matchers

```javascript
// Equality
expect(actual).toBe(expected);
expect(actual).toEqual(expected);

// Truthiness
expect(value).toBeTruthy();
expect(value).toBeFalsy();
expect(value).toBeNull();
expect(value).toBeUndefined();
expect(value).toBeDefined();

// Comparison
expect(value).toBeGreaterThan(10);
expect(value).toBeLessThan(100);

// String matching
expect(string).toContain('substring');
expect(string).toMatch(/pattern/);

// Array/Object
expect(array).toContain(item);
expect(obj).toHaveProperty('propertyName');

// Exceptions
expect(function() {
    // Code that should throw
}).toThrow();
```

### Custom Matchers

Use the custom `toBeEqual` matcher for deep equality with descriptive messages:

```javascript
beforeEach(function() {
    jasmine.addMatchers(global.KLF_TestUtils.matchers);
});

it('should return correct data structure', function() {
    var result = someFunction();
    
    expect(result).toBeEqual({
        success: true,
        data: ['item1', 'item2']
    }, 'Result structure is correct');
});
```

The custom matcher provides better error messages when assertions fail.

## Testing Patterns

### Testing Successful Operations

```javascript
it('should create a group mapping', function() {
    var group1 = testUtils.createGroup(testUtils.getRandomGroupName());
    var group2 = testUtils.createGroup(testUtils.getRandomGroupName());
    
    var remoteGroups = [{
        sysId: 'group1',
        name: group1.getValue('name'),
        source: group1.getValue('source')
    }, {
        sysId: 'group2',
        name: group2.getValue('name'),
        source: group2.getValue('source')
    }];
    
    var result = global.KLF_RecordSync_GroupUtils.createMappingFromRemote(remoteGroups);
    
    expect(result.success).toBe(true);
    expect(result.hasMissingGroups).toBe(false);
    expect(result.mapping).toBeEqual({
        group1: group1.getUniqueValue(),
        group2: group2.getUniqueValue()
    }, 'Group mapping is correct');
});
```

### Testing Error Conditions

```javascript
it('should throw error if table name does not exist', function() {
    expect(function() {
        groupUtils.getGroupFieldsInTable('nonexistent_table');
    }).toThrow();
});

it('should throw error if parameter is falsy', function() {
    expect(function() {
        someMethod(null);
    }).toThrow();
    
    expect(function() {
        someMethod(undefined);
    }).toThrow();
    
    expect(function() {
        someMethod('');
    }).toThrow();
});
```

### Testing Return Values

```javascript
it('should return an empty array if no data exists', function() {
    var result = groupUtils.getGroupsUsedInNotifications([]);
    expect(result).toBeEqual([], 'Groups are empty');
});

it('should return null if there are no groups to sync', function() {
    expect(groupUtils.syncGroups([])).toBeNull('Response should be null');
});
```

### Testing Collections

```javascript
it('should return the unique groups in the specified table', function() {
    var group1 = testUtils.createGroup(testUtils.getRandomGroupName());
    var group2 = testUtils.createGroup(testUtils.getRandomGroupName());
    
    // Create records using the groups
    // ... record creation code ...
    
    var expectedGroups = [group1.getUniqueValue(), group2.getUniqueValue()].sort();
    var actualGroups = groupUtils.getUniqueGroupsInTable(tableName).sort();
    
    expect(actualGroups).toBeEqual(expectedGroups, 'Groups are correct');
});
```

### Testing Updates

```javascript
it('should update the notifications using the group mapping', function() {
    var group1 = testUtils.createGroup(testUtils.getRandomGroupName());
    var group2 = testUtils.createGroup(testUtils.getRandomGroupName());
    
    // Create notifications
    var notification = createNotification(testUtils, 'notification', [group1, group2]);
    
    var groupMapping = {
        mapping: {
            [group1.getUniqueValue()]: 'newGroup1',
            [group2.getUniqueValue()]: 'newGroup2'
        }
    };
    
    var response = utils.updateNotifications(groupMapping, [notification.getUniqueValue()]);
    
    // Verify update
    var updatedNotification = new GlideRecord('sysevent_email_action');
    updatedNotification.get(notification.getUniqueValue());
    expect(updatedNotification.getValue('recipient_groups')).toContain('newGroup1');
    expect(updatedNotification.getValue('recipient_groups')).toContain('newGroup2');
    
    expect(response.success).toBe(true);
    expect(response.error).toBeFalsy();
});
```

## Helper Functions in Tests

Create helper functions within test files for reusable test logic:

```javascript
function KLF_YourScriptIncludeTest() {
    /**
     * Create a test notification with specified groups
     * @param {global.KLF_TestUtils} testUtils 
     * @param {string} name
     * @param {GlideRecord[]} groups
     * @returns {GlideRecord}
     */
    function createNotification(testUtils, name, groups) {
        var notification = new GlideRecord('sysevent_email_action');
        notification.newRecord();
        notification.name = name;
        if (Array.isArray(groups)) {
            notification.recipient_groups = groups.map(function(group) {
                return group.getUniqueValue();
            }).join(',');
        }
        notification.update();
        testUtils.recordTracker.trackByGlideRecord(notification);
        return notification;
    }
    
    /**
     * Create empty mapping object
     * @returns {GroupMapping}
     */
    function createEmptyMapping() {
        return {
            success: false,
            hasMissing: false,
            missing: [],
            mapping: {}
        };
    }
    
    describe('Tests', function() {
        // Use helper functions in tests
    });
}
```

## Skipping Tests

Use `xdescribe()` or `xit()` to temporarily skip tests:

```javascript
// Skip an entire describe block
xdescribe('createGroupMapping()', function() {
    it('should work', function() {
        // This will be skipped
    });
});

// Skip a single test
describe('someMethod()', function() {
    xit('should handle edge case', function() {
        // This will be skipped
    });
    
    it('should handle normal case', function() {
        // This will run
    });
});
```

## Variable Declarations & Array Operations

Test code follows the same rules as `javascript.instructions.md` (const/let, never
`var`; prefer array methods like `.map()`/`.filter()`/`.forEach()` over `for` loops) —
see that file for examples instead of repeating them here.

## Sorting for Consistent Comparisons

When comparing arrays or collections, sort them first to avoid order-dependent failures:

```javascript
/**
 * @param {GroupField} f1 
 * @param {GroupField} f2 
 * @returns {number}
 */
function sortFieldsAscByColumnName(f1, f2) {
    return f1.columnName.localeCompare(f2.columnName);
}

it('should return fields in consistent order', function() {
    var actualFields = utils.getFields();
    actualFields.sort(sortFieldsAscByColumnName);
    
    var expectedFields = [...];
    expectedFields.sort(sortFieldsAscByColumnName);
    
    expect(actualFields).toBeEqual(expectedFields);
});

// For simple string/number arrays
expect(actualArray.sort()).toBeEqual(expectedArray.sort());
```

## Testing Instance-Specific Code

When testing code that creates instances of the class being tested:

```javascript
describe('KLF_RecordSync_GroupUtils', function() {
    /** @type {global.KLF_RecordSync_GroupUtils} */
    var groupUtils;
    
    /** @type {global.KLF_TestUtils} */
    var testUtils;
    
    beforeEach(function() {
        testUtils = new global.KLF_TestUtils();
        groupUtils = new global.KLF_RecordSync_GroupUtils(config);
    });
    
    afterEach(function() {
        testUtils.cleanup();
    });
    
    it('should use the instance methods', function() {
        var result = groupUtils.someMethod();
        expect(result).toBeDefined();
    });
});
```

## Testing Static Methods

For static/class-level methods, call directly on the global object:

```javascript
it('should call static method', function() {
    var result = global.KLF_RecordSync_GroupUtils.createMappingFromRemote(data);
    expect(result).toBeDefined();
});
```

## Best Practices

1. **Always use KLF_TestUtils for data creation and cleanup**
   - Use `testUtils.createUser()`, `testUtils.createGroup()`, etc.
   - These methods automatically track records for cleanup

2. **Track all created records**
   - Any record created outside of `KLF_TestUtils` helper methods must be manually tracked
   - Use `testUtils.recordTracker.trackByGlideRecord(record)`

3. **Use descriptive variable names**
   - `var userGR = new GlideRecord('sys_user')` not `var gr = new GlideRecord('sys_user')`
   - Makes tests easier to read and maintain

4. **Include assertion messages**
   - Add descriptive messages to assertions: `expect(result).toBe(true, 'Result should be true')`
   - Helps identify failures quickly

5. **Test both success and failure paths**
   - Test expected behavior with valid inputs
   - Test error handling with invalid inputs
   - Test edge cases and boundary conditions

6. **Keep tests independent**
   - Each test should be able to run in isolation
   - Use `beforeEach()` and `afterEach()` to ensure clean state
   - Don't rely on execution order of tests

7. **Use helper functions for repeated setup**
   - Create helper functions within the test file for common test data creation
   - Include JSDoc annotations for helper functions

8. **Prefer array methods**
   - Use `.map()`, `.filter()`, `.forEach()` over traditional `for` loops
   - Makes code more readable and functional

9. **Test return values explicitly**
   - Verify all properties of returned objects
   - Check for expected errors or null values
   - Test that collections have expected size and content

10. **Use proper GlideRecord queries**
    - Use descriptive variable names: `var userGR = new GlideRecord('sys_user')`
    - Always check if `.get()` or `.next()` succeeds before using the record

## Complete Test Example

```javascript
function KLF_ExampleUtilsTest() {
    /**
     * Helper function to create test data
     * @param {global.KLF_TestUtils} testUtils 
     * @param {string} name
     * @returns {GlideRecord}
     */
    function createTestRecord(testUtils, name) {
        var record = new GlideRecord('sys_user');
        record.newRecord();
        record.user_name = name;
        record.update();
        testUtils.recordTracker.trackByGlideRecord(record);
        return record;
    }

    describe('KLF_ExampleUtils', function() {
        /** @type {global.KLF_TestUtils} */
        var testUtils;
        
        /** @type {global.KLF_ExampleUtils} */
        var utils;
        
        beforeEach(function() {
            jasmine.addMatchers(global.KLF_TestUtils.matchers);
            testUtils = new global.KLF_TestUtils();
            utils = new global.KLF_ExampleUtils();
        });
        
        afterEach(function() {
            testUtils.cleanup();
        });
        
        describe('processUsers()', function() {
            it('should process valid users successfully', function() {
                var user1 = testUtils.createUser(testUtils.getRandomUsername());
                var user2 = testUtils.createUser(testUtils.getRandomUsername());
                
                var userIds = [user1.getUniqueValue(), user2.getUniqueValue()];
                var result = utils.processUsers(userIds);
                
                expect(result.success).toBe(true, 'Operation succeeded');
                expect(result.processedCount).toBe(2, 'Processed count is correct');
                expect(result.errors).toBeEqual([], 'No errors occurred');
            });
            
            it('should throw error if users parameter is null', function() {
                expect(function() {
                    utils.processUsers(null);
                }).toThrow();
            });
            
            it('should return empty result for empty user list', function() {
                var result = utils.processUsers([]);
                
                expect(result.success).toBe(true);
                expect(result.processedCount).toBe(0);
            });
        });
        
        describe('findActiveUsers()', function() {
            it('should return only active users', function() {
                var activeUser = testUtils.createUser(testUtils.getRandomUsername());
                activeUser.active = true;
                activeUser.update();
                
                var inactiveUser = testUtils.createUser(testUtils.getRandomUsername());
                inactiveUser.active = false;
                inactiveUser.update();
                
                var result = utils.findActiveUsers();
                
                expect(result).toContain(activeUser.getUniqueValue());
                expect(result).not.toContain(inactiveUser.getUniqueValue());
            });
        });
    });
}
```

## Common Pitfalls to Avoid

1. **Not cleaning up test data**
   - Always use `testUtils.cleanup()` in `afterEach()`
   - Track all created records

2. **Using hard-coded values**
   - Use `testUtils.getRandomUsername()` or `chance` for dynamic data
   - Prevents test conflicts and makes tests more robust

3. **Testing implementation instead of behavior**
   - Test what the method does, not how it does it
   - Focus on inputs and outputs

4. **Creating interdependent tests**
   - Each test should be independent
   - Don't rely on side effects from previous tests

5. **Not testing error conditions**
   - Always test what happens with invalid inputs
   - Verify error messages and exception types

6. **Forgetting to add custom matchers**
   - Add `jasmine.addMatchers(global.KLF_TestUtils.matchers)` in `beforeEach()`
   - Enables better error messages with `toBeEqual()`

## References

- **Jasmine Documentation:** https://jasmine.github.io/
- **Chance.js Documentation:** https://chancejs.com/
- **KLF_TestUtils:** Available in `global.KLF_TestUtils`
- **JavaScript Guidelines:** See `.github/instructions/javascript.instructions.md`
