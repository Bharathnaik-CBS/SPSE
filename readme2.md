Browser / Web Client
   |
   |  HTTPS / REST API requests
   v
Next.js + React Front End
   |
   |  Authenticated API calls with JWT token
   v
NestJS API Layer
   |-- Controllers: receive requests and apply guards
   |-- Services: business logic and validation
   |-- DTOs: request validation contracts
   |-- Guards: JWT and permission checks
   v
Prisma ORM
   v
PostgreSQL Database
