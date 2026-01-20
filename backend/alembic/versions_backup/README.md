# Migration History (Backup)

This directory contains the original migration files that were used during development. These have been squashed into a single `initial_schema` migration for cleaner deployment.

## Original Migrations

1. **001_initial_migration.py** - Created initial users, concerts, and favorites tables
2. **002_add_festival_day.py** - Added `festival_day` column to concerts table
3. **003_add_favorites_public.py** - Added `favorites_public` column to users table

## Why Squashed?

For Kubernetes deployment, it's cleaner to start with a single migration that contains the complete schema rather than replaying all development migrations. This:

- Speeds up initial database setup
- Simplifies debugging
- Reduces migration complexity
- Follows production deployment best practices

## Current Migration

The current migration file in `alembic/versions/` contains the complete schema with all three changes integrated.

## Recreating the Database

If you need to recreate the database from scratch:

```bash
# Drop all tables
docker exec hf-planner-db psql -U hfplanner -d hfplanner -c "DROP TABLE IF EXISTS favorites CASCADE; DROP TABLE IF EXISTS concerts CASCADE; DROP TABLE IF EXISTS users CASCADE; DROP TABLE IF EXISTS alembic_version CASCADE;"

# Run migration
poetry run alembic upgrade head

# Seed test data
poetry run python -m app.utils.seed
```
