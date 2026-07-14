# Developer Guidelines & Project Standards

## Architecture & Code Conventions

### 1. Environment Configuration
* Do not install `dotenv` for environment variables.
* Use Node's built-in `process.loadEnvFile()` at the entry point ([server.cjs](file:///Users/jay/Desktop/Personal%20Projects/onepfp/server.cjs)) to natively parse and load variables from `.env` in the root directory.

### 2. Database Connection Management (Oracle DB)
* Database connections must be fetched via the utility in [utils/db.js](file:///Users/jay/Desktop/Personal%20Projects/onepfp/utils/db.js).
* Always query using a wrapper structure containing a `try...catch...finally` block.
* **CRITICAL**: You must always call `await connection.close()` in the `finally` block to prevent database connection leaks.

### 3. Authentication & Security
* Passwords must be hashed during signup and verified during login using the helper functions in [utils/user.js](file:///Users/jay/Desktop/Personal%20Projects/onepfp/utils/user.js). These functions use Node's native `crypto.scrypt` hashing algorithm.
* Authenticated sessions must utilize the JWT utility in [utils/jwt.js](file:///Users/jay/Desktop/Personal%20Projects/onepfp/utils/jwt.js) (which uses `jsonwebtoken` package) to sign and verify tokens.

### 4. API Testing
* All endpoints must have corresponding request files (`.bru`) maintained inside the [bruno/](file:///Users/jay/Desktop/Personal%20Projects/onepfp/bruno) folder.
* Variables like `baseUrl` must be referenced using environment config files in [bruno/environments/config.bru](file:///Users/jay/Desktop/Personal%20Projects/onepfp/bruno/environments/config.bru) or [bruno/config.bru](file:///Users/jay/Desktop/Personal%20Projects/onepfp/bruno/config.bru).


### 5. Writing API
* Properly document each end point using the annotations on top of each api 
* Properly document each function/method in worker/utility files using JSDoc-style block comments on top of each function
* avoid using uncessary empty lines
* avoid commenting inside the function scope