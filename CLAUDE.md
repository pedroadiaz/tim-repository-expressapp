# CLAUDE.md - Express App Guidelines

## Build Commands
- Start app: `yarn start` or `npm start` (runs nodemon server.js)
- Install dependencies: `yarn install` or `npm install`
- No test commands configured (add testing framework when needed)

## Code Style Guidelines
- **Modules**: Use CommonJS (require/exports) for consistency
- **Formatting**: Use 4-space indentation, consistent semicolons
- **Naming**: camelCase for variables/functions, snake_case for DB columns
- **API Pattern**: RESTful endpoints with middleware validation
- **Error Handling**: Use HTTP status codes, centralized error handlers
- **Database**: Use parameterized queries, avoid string concatenation
- **Authentication**: JWT for API, session for web interface
- **Security**: Validate all inputs, sanitize DB queries, use Helmet.js

## Environment Variables
- DATABASE_ENDPOINT, DATABASE_USER, DATABASE_PASSWORD
- SERVER_PORT (defaults to 3000)
- PAYPAL_CLIENT_ID, PAYPAL_SECRET

## Tools
- Express.js for routing/API
- MySQL for database (use prepared statements)
- Passport.js for authentication
- Multer for file uploads