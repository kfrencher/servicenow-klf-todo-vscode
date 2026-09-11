---
description: 'JavaScript coding guidelines with TypeScript type safety using JSDoc annotations.'
applyTo: '**/*.ts, **/*.js'
---
# JavaScript Coding Guidelines

## TypeScript Type Safety for JavaScript

All JavaScript code in this project must include comprehensive JSDoc type annotations for strict type safety. We use TypeScript's type checker on JavaScript files.

### Required Type Annotations

1. **All function parameters must be typed:**
   ```javascript
   /**
    * @param {string} name - User's name
    * @param {number} age - User's age
    * @returns {User}
    */
   function createUser(name, age) { }
   ```

2. **All class properties must be typed:**
   ```javascript
   class TaskManager {
       /**
        * @param {HTMLElement} container
        */
       constructor(container) {
           /** @type {Task[]} */
           this.tasks = [];
           
           /** @type {FilterType} */
           this.currentFilter = 'all';
       }
   }
   ```

3. **All return types must be specified:**
   ```javascript
   /**
    * Get filtered tasks
    * @returns {Task[]}
    */
   getFilteredTasks() { }
   ```

4. **Define custom types with @typedef:**
   ```javascript
   /**
    * @typedef {Object} Task
    * @property {number} id - Unique task identifier
    * @property {string} text - Task description
    * @property {boolean} completed - Completion status
    */
   
   /**
    * @typedef {'all' | 'pending' | 'completed'} FilterType
    */
   ```

5. **Type DOM queries and event handlers:**
   ```javascript
   /** @type {HTMLInputElement | null} */
   const input = document.querySelector('#task-input');
   
   /** @type {NodeListOf<HTMLButtonElement>} */
   const buttons = document.querySelectorAll('.btn');
   
   /**
    * @param {Event} event
    * @returns {void}
    */
   handleSubmit(event) { }
   ```

6. **Handle null/undefined explicitly:**
   ```javascript
   /**
    * @param {string | null} value
    * @returns {string}
    */
   function processValue(value) {
       if (value === null) {
           return '';
       }
       return value.trim();
   }
   ```

7. **Use strict typing for arrays and objects:**
   ```javascript
   /** @type {Array<{id: number, name: string}>} */
   const items = [];
   
   /** @type {Record<string, number>} */
   const scores = {};
   
   /** @type {Map<number, Task>} */
   const taskMap = new Map();
   ```

### TypeScript Configuration

This project uses `tsconfig.json` for type checking:
- `strictNullChecks: true` - Null and undefined must be handled explicitly
- `checkJs: true` / `allowJs: true` - plain `.js` files are type-checked like `.ts`
- `strict: false` overall, but the `typescript-strict-plugin` entry in `plugins`
  applies full strict-mode checking to configured paths; check `tsconfig.json` for the
  exact paths

### Validation

Run `npx tsc` to validate all type annotations. Zero errors required before committing code.

## Code Style

- Prefer modern JavaScript (ES6+) features like const/let, arrow functions, and template literals
- **Always use `const` by default**, only use `let` when reassignment is necessary, never use `var`
- **Prefer array methods** (`.map()`, `.filter()`, `.reduce()`, `.forEach()`, `.find()`, `.some()`, `.every()`) over traditional `for` loops
- Always handle potential null/undefined values
- Use type guards for runtime type checking
- Prefer specific types over `any`
- Document all functions with JSDoc, including their inputs and outputs
- Use single-quoted strings unless double quotes are necessary
- Use four-space indentation

### Array Methods Examples

```javascript
// ✅ Good - Use array methods
const activeUsers = users.filter(user => user.active);
const userNames = users.map(user => user.name);
const hasAdmin = users.some(user => user.role === 'admin');
const totalScore = scores.reduce((sum, score) => sum + score, 0);

// ❌ Avoid - Traditional for loops
const activeUsers = [];
for (let i = 0; i < users.length; i++) {
    if (users[i].active) {
        activeUsers.push(users[i]);
    }
}
```

### Variable Declaration Examples

```javascript
// ✅ Good - Use const for values that won't be reassigned
const userName = 'John';
const users = [];
const config = { theme: 'dark' };

// ✅ Acceptable - Use let only when reassignment is needed
let counter = 0;
counter++;

// ❌ Never use var
var oldStyle = 'avoid';
```

## Naming Conventions

- Use PascalCase for component names, interfaces, and type aliases
- Use camelCase for variables, functions, and methods, beginning with a lowercase character
- Prefix private class members with underscore (_)
- Use ALL_CAPS for constants
- Use concise, human-readable, semantic names for variables, functions, and parameters (for example, `message` rather than `msg` and `taskRecord` rather than `gr`)

## Code Quality

- Use meaningful variable and function names that clearly describe their purpose
- Include helpful comments for complex logic
- Add error handling for user inputs and API calls
- Use readonly arrays when appropriate: `/** @type {readonly Task[]} */`
- Cast types explicitly when necessary: `/** @type {HTMLInputElement} */ (element)`
- Remove commented-out code once debugging is complete.
- Use single-line comments in function bodies, except for inline JSDoc type definitions.

## Example Complete Class

```javascript
/**
 * @typedef {Object} User
 * @property {number} id - User ID
 * @property {string} name - User name
 * @property {boolean} active - Active status
 */

/**
 * UserManager handles user operations
 */
class UserManager {
    /**
     * @param {HTMLElement} container - Container element
     */
    constructor(container) {
        /** @type {User[]} */
        this.users = [];
        
        /** @type {HTMLElement} */
        this.container = container;
    }
    
    /**
     * Add a new user
     * @param {string} name - User name
     * @returns {User}
     */
    addUser(name) {
        /** @type {User} */
        const user = {
            id: Date.now(),
            name: name,
            active: true
        };
        
        this.users.push(user);
        return user;
    }
    
    /**
     * Find user by ID
     * @param {number} id - User ID
     * @returns {User | undefined}
     */
    findUser(id) {
        return this.users.find(user => user.id === id);
    }
}
```