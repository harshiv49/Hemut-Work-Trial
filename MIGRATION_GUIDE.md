# Database Migration Guide

## Overview

This project uses Alembic for database migrations. Alembic code is **synchronous** while the application runtime uses **asynchronous** SQLAlchemy.

## Configuration

- **Alembic URL**: `sqlite:///./app.db` (synchronous)
- **Runtime URL**: `sqlite+aiosqlite:///./app.db` (asynchronous)

## Common Commands

### Creating a New Migration

After modifying models in `schemas/models.py`:

```bash
# Activate virtual environment
source venv/bin/activate

# Create migration with autogenerate
alembic revision --autogenerate -m "Description of changes"

# Example:
alembic revision --autogenerate -m "Add posts table"
```

### Applying Migrations

```bash
# Apply all pending migrations
alembic upgrade head

# Apply next migration
alembic upgrade +1

# Apply specific migration
alembic upgrade <revision_id>
```

### Rolling Back Migrations

```bash
# Rollback last migration
alembic downgrade -1

# Rollback to specific revision
alembic downgrade <revision_id>

# Rollback all migrations
alembic downgrade base
```

### Viewing Migration History

```bash
# Show current revision
alembic current

# Show migration history
alembic history

# Show verbose history
alembic history --verbose
```

## Workflow Example

1. **Modify your models** in `schemas/models.py`:
   ```python
   class Post(BaseModel):
       __tablename__ = "posts"
       
       title = Column(String, nullable=False)
       content = Column(String, nullable=False)
       user_id = Column(Integer, ForeignKey("users.id"))
   ```

2. **Import the model** in `alembic/env.py`:
   ```python
   from schemas.models import User, Post  # Add your new model
   ```

3. **Generate migration**:
   ```bash
   alembic revision --autogenerate -m "Add posts table"
   ```

4. **Review the generated migration** in `alembic/versions/`:
   - Check the `upgrade()` function
   - Check the `downgrade()` function
   - Make manual adjustments if needed

5. **Apply the migration**:
   ```bash
   alembic upgrade head
   ```

6. **Verify the changes**:
   - Check your database
   - Test your API endpoints

## Important Notes

- **Always review** generated migrations before applying
- **Test migrations** in development before production
- **Backup your database** before running migrations in production
- **Synchronous only**: Alembic migrations use synchronous SQLAlchemy
- **Import models**: Always import new models in `alembic/env.py`

## Troubleshooting

### Migration not detecting changes
1. Ensure the model is imported in `alembic/env.py`
2. Check that the model inherits from `Base`
3. Try creating a manual migration:
   ```bash
   alembic revision -m "Manual migration"
   ```

### Database locked error
- Close any database connections
- Ensure no other processes are using the database
- For SQLite, only one write operation at a time

### Rollback issues
- Check the `downgrade()` function in the migration
- Some operations may not be reversible (e.g., data deletion)
- Consider creating a database backup before complex migrations

