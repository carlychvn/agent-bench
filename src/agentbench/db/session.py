"""Database session management for FastAPI.

This module provides:
- SQLAlchemy engine (connection to Postgres)
- SessionLocal factory (creates database sessions)
- get_db() dependency (manages sessions for FastAPI routes)
"""

from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from agentbench.config import get_settings

# STEP 1 TODO: Create SQLAlchemy engine from settings
# The engine manages the connection pool to Postgres
# Hint:
#   settings = get_settings()
#   engine = create_engine(
#       settings.database_url,
#       pool_pre_ping=True,  # Verify connections before using them
#   )

# STEP 1 TODO: Create SessionLocal factory that creates database sessions
# Each session represents a "workspace" for database operations
# Hint:
#   SessionLocal = sessionmaker(
#       bind=engine,
#       autocommit=False,  # We'll commit manually for control
#       autoflush=False,   # We'll flush manually for control
#   )


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency that provides a database session.

    Usage in routes:
        @router.get("/tasks")
        def list_tasks(db: Session = Depends(get_db)):
            tasks = db.query(BenchmarkTaskModel).all()
            return tasks

    The session is automatically closed after the request finishes.
    """
    # STEP 1 TODO: Implement this function
    # 1. Create a session using SessionLocal()
    # 2. Yield the session to the route
    # 3. Always close the session in a finally block
    # Hint:
    #   db = SessionLocal()
    #   try:
    #       yield db
    #   finally:
    #       db.close()

    raise NotImplementedError("STEP 1 TODO: Implement get_db() function")
