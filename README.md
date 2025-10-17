npm install

cp .env.example .env

npx prisma migrate dev --name init

node prisma/seed.js

npm run dev
