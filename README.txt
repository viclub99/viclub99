
VI CLUB99 - Advanced Starter (Full)
----------------------------------

This package contains a minimal full-stack starter project for VI CLUB99.

Structure:
- server/        -> Node + Express backend (SQLite)
- client/static  -> Static User and Admin frontends (HTML/CSS/JS)
  - user.html (User interface)
  - admin.html (Admin interface)
  - logo.svg
  - user.js, admin.js, style.css

How to run (local):

1) Install Node (>=14)
2) Start server:
   cd server
   npm install
   node index.js
   Server runs at http://localhost:4000

3) Open user UI:
   http://localhost:4000/static/user.html

4) Open admin UI:
   http://localhost:4000/static/admin.html

Admin token (demo): admintoken123
Use it for admin endpoints and uploads.

Notes:
- This is an MVP starter. For production, add authentication, secure file storage, HTTPS, and hardening.
- The server serves static client from /static. Uploaded files are in server/uploads.
