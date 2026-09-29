# POS & Inventory Management System

## Project overview

A full-stack point-of-sale and inventory-management application for retail checkout, billing, products, categories, stock, warehouses, and operational reporting.

## What it contains

- React, Vite, and TypeScript frontend
- Express and TypeScript backend API
- Prisma ORM with PostgreSQL/Neon support
- Docker Compose for local orchestration
- Authentication and routed application screens
- Barcode/QR scanning dependencies
- Charts and dashboard reporting
- PDF/email, payment, and AI-provider integration dependencies

## Current status

The repository contains a runnable full-stack foundation and documented Docker/local setup. Installed provider packages do not by themselves prove every integration is enabled or production-qualified. Payment callbacks, inventory mutations, authorization, totals, audit behavior, and recovery require current verification.

## Quick start with Docker

```bash
docker compose up --build
```

Expected local services:

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5000/api`
- PostgreSQL: port `5432`

## Safe local configuration

Create a local backend environment file from documented examples and use placeholders until real development values are supplied securely:

```env
PORT=5000
DATABASE_URL=<your-postgresql-connection-string>
JWT_SECRET=<generate-a-long-random-secret>
```

Never commit real database passwords, JWT secrets, payment credentials, email credentials, or AI-provider keys.

## Verification priorities

1. Authentication and role authorization
2. Product, category, warehouse, and stock consistency
3. Checkout calculations, taxes, discounts, and invoice generation
4. Payment initiation and callback verification
5. Concurrent stock updates and rollback behavior
6. Backup, restore, audit, and end-to-end tests

## Recommended next milestone

Publish an implemented-versus-provider-dependent feature matrix and qualify one complete sale from product scan through payment, inventory decrement, receipt, reporting, and failure recovery.
