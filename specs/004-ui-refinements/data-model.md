# Data Model: 004-ui-refinements

**Date**: 2026-02-24

## Overview

This feature is primarily presentation-layer. No new database tables, columns, or migrations are required. The only data change is a seed modification.

## Seed Data Change

### Employee Account — Add Password Credential

**Entity**: `account` table (Better Auth managed)

**Current state**: The seeded employee (`employee@client.com`) has no credential-provider account record — only a magic-link-capable user record.

**Required state**: Add a credential-provider account record with a hashed password so the employee can log in via email+password in development mode.

| Field | Value |
|-------|-------|
| accountId | `<employee.id>` |
| providerId | `"credential"` |
| userId | `<employee.id>` |
| password | hashed `"employee123"` |

**Validation**: Password must be hashed using Better Auth's internal `hashPassword` utility (bcrypt-based). Raw passwords must never be stored.

**Scope**: Seed data only. No schema migration. No production data impact.
