---
description: Instructions for integrating with ServiceNow
applyTo: '**/*.js, **/*.ts'
---
Table Manager Pattern is an organizational pattern for JavaScript code written for a table. This pattern is applicable to the primary tables that a user interacts with to submit data. Things like a request form, an approval form, or a task form.

The pattern involves centralizing code for Business Rules, UI Actions, and ACLs for a table into one Script Include. The name of the Script Include and the functions in the Script Include follow a naming convention to make it easy to determine what functions are applicable to each ServiceNow component.

## Script Include Name

The Script Include name is prefixed with the table name `${TableName}Manager`. For example, the table manager for a table with the name `x_my_app_request` would be called `RequestManager`.

## Table Manager Constructor

The table manager is a JavaScript object with a set of functions. It is created through an immediately invoked function expression (IIFE) that returns an object. It looks like the following:

```javascript
const RequestManager = (function () {
    // my private variables and functions for table manager go here
    const privateVar = '';

    function privateFunction() {}

    // public variables and functions for table manager go here
    return new (class {
        showSaveAsDraft(request) {
            // ...
        }

        saveAsDraft(request) {
            // ...
        }

        // ...
    })();
})();
```

## Function Names

### Business Rules

Business rules functions are prefixed with "on". For example, a business rule that is triggerred when the request status change might be defined like the following:

```javascript
const RequestManager = (function () {
    return new (class {
        /**
         * Called by a before business rule when the request status changes
         * @param {GlideRecord}
         */
        onBeforeStatusChange(request) {
            // ...
        }
        // ...
    })();
})();
```

### UI Actions

UI Actions contain JavaScript in two fields, the Condition field and the Script field. The function for the Script field is the camelcase version of the UI Action name. The function for the Condition field is the name of the Script field function prefixed with "show". For example, for a UI Action named "Save as Draft" you would define the following two functions. Place the Condition function before the Script function. This helps in navigating the code:

```javascript
const RequestManager = (function () {
    return new (class {
        /**
         * Returns true if user has access to "Save as Draft" UI Action
         * This function is called from the Condition field of the UI Action
         * @param {GlideRecord} request
         * @returns {boolean}
         */
        showSaveAsDraft(request) {
            // ...
        }

        /**
         * Saves the request in a Draft status
         * This function is called from the Script field of the UI Action
         * @param {GlideRecord} request
         */
        saveAsDraft(request) {
            // ...
        }
        // ...
    })();
})();
```

### ACLs

Functions for ACLs are prefixed with "can". These may be ACLs for write on a table or write on all fields on a table or read on a specific field etc. For example, a function that checks if a user can write on the request table might be defined like the following:

```javascript
const RequestManager = (function () {
    return new (class {
        /**
         * Returns true if user has write access to the request table
         * @param {GlideRecord} request
         * @returns {boolean}
         */
        canWrite(request) {
            // ...
        }
        // ...
    })();
})();
```

### Read ACL as onQuery Business Rule

Read ACLs must be implmented with a `canRead` function as well as an `onQuery` business rule to enforce the read restrictions at the query level. The `canRead` function will restrict the user from reading records, but if only a read ACL is implemented list views will attempt to show all records, but records that the user does not have access to will be hidden after the query is executed. This throws off paging in the user interface.

To avoid this issue an `onQuery` business rule should be implemented to modify the query issued to the database so only records that the user has read access to are returned.
