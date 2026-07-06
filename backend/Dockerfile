FROM node:20-alpine

# Install Prisma dependencies (OpenSSL and libc compatibility layer for Alpine)
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

COPY . .

RUN npx prisma generate

EXPOSE 5000

CMD ["sh", "-c", "npx prisma db push && npm run dev"]
