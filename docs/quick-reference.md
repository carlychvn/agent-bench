# Quick Reference - Command Cheat Sheet

This is your go-to reference for common commands and workflows.

## 🚀 Getting Started (First Time Setup)

```bash
# 1. Install dependencies
uv sync --extra database --extra mcp --extra execution

# 2. Copy environment config
cp .env.example .env

# 3. Start Postgres
docker compose up -d postgres

# 4. Run migrations
uv run alembic upgrade head

# 5. Start API
uv run uvicorn agentbench.api.main:app --reload --host 127.0.0.1 --port 8000

# 6. Start frontend (separate terminal)
cd apps/web && npm install && npm run dev -- --webpack
```

## 📍 Daily Development

### Start Everything
```bash
# Terminal 1: Postgres (if not running)
docker compose up postgres

# Terminal 2: API
uv run uvicorn agentbench.api.main:app --reload --host 127.0.0.1 --port 8000

# Terminal 3: Frontend
cd apps/web && npm run dev -- --webpack
```

### Check Status
```bash
# API health
curl http://127.0.0.1:8000/health

# Postgres status
docker compose ps

# Database tables
docker exec agent-bench-postgres-1 psql -U agentbench -d agentbench -c '\dt'
```

## 🗄️ Database Operations

### Migrations
```bash
# Create new migration
uv run alembic revision --autogenerate -m "description"

# Apply migrations
uv run alembic upgrade head

# Rollback one migration
uv run alembic downgrade -1

# See migration history
uv run alembic history

# Current version
uv run alembic current
```

### Direct Database Access
```bash
# Connect to Postgres
docker exec -it agent-bench-postgres-1 psql -U agentbench -d agentbench

# In psql:
\dt                           # List tables
\d benchmark_tasks            # Describe table
SELECT * FROM benchmark_tasks LIMIT 5;
\q                            # Quit
```

### Reset Database
```bash
# WARNING: Deletes all data!
docker compose down postgres
docker compose up -d postgres
uv run alembic upgrade head
```

## 🧪 Testing

### Run All Tests
```bash
uv run pytest
```

### Run Specific Test File
```bash
uv run pytest tests/test_api.py
```

### Run with Verbose Output
```bash
uv run pytest -v -s
```

### Run with Coverage
```bash
uv run pytest --cov=agentbench
```

## 🐛 Debugging

### View API Logs
```bash
# API runs in terminal - logs appear there
# For more detail, add to api/main.py:
import logging
logging.basicConfig(level=logging.DEBUG)
```

### View Postgres Logs
```bash
docker logs agent-bench-postgres-1
```

### View SQL Queries
```python
# In db/session.py, uncomment:
engine = create_engine(
    settings.database_url,
    echo=True,  # <-- Shows all SQL queries
    pool_pre_ping=True,
)
```

### Interactive Python Shell with DB
```bash
uv run python

>>> from agentbench.db import SessionLocal, BenchmarkTaskModel
>>> db = SessionLocal()
>>> tasks = db.query(BenchmarkTaskModel).all()
>>> tasks[0].title
'My Task'
>>> db.close()
```

## 🔧 Common Tasks

### Create a Task via API
```bash
curl -X POST http://127.0.0.1:8000/api/v1/benchmark-tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Task",
    "repository_url": "https://github.com/owner/repo",
    "base_commit": "abc123...",
    "reference_commit": "def456...",
    "prompt": "Fix the bug",
    "grading_paths": ["tests/"],
    "fail_to_pass": ["test_foo"],
    "pass_to_pass": [],
    "test_command": ["pytest"],
    "environment": {
      "image": "python:3.12@sha256:...",
      "setup_commands": []
    }
  }'
```

### List All Tasks
```bash
curl http://127.0.0.1:8000/api/v1/benchmark-tasks | jq
```

### Get Specific Task
```bash
curl http://127.0.0.1:8000/api/v1/benchmark-tasks/{task-id} | jq
```

### Create Evaluation
```bash
curl -X POST http://127.0.0.1:8000/api/v1/evaluations \
  -H "Content-Type: application/json" \
  -d '{
    "benchmark_task_id": "task-uuid-here",
    "models": ["claude-sonnet-4"]
  }'
```

## 🐳 Docker Commands

### Pull Image with Digest
```bash
# Get digest from Docker Hub
docker pull python:3.12
docker inspect python:3.12 | grep -A 1 RepoDigests

# Use in task:
"image": "python:3.12@sha256:abc123..."
```

### Test Docker Runner
```python
# In execution/docker_runner.py, uncomment bottom section:
if __name__ == "__main__":
    test_docker_runner()
```

### Clean Up Docker
```bash
# Remove stopped containers
docker container prune

# Remove unused images
docker image prune

# Remove volumes
docker volume prune

# Nuclear option (removes everything)
docker system prune -a
```

## 📝 Git Operations (Step 2)

### Test Git Cloning
```python
from agentbench.execution.git_repo import GitRepository

repo = GitRepository()
path = repo.clone_or_update("https://github.com/owner/repo")
print(f"Cloned to: {path}")
```

### Extract File from Commit
```python
content = repo.get_file_content(
    repo_path=path,
    commit_sha="full-40-char-sha",
    file_path="src/example.py"
)
print(content.decode())
```

## 🤖 Agent Testing (Step 4)

### Set API Key
```bash
# In .env file:
echo "ANTHROPIC_API_KEY=your-key-here" >> .env

# Or export:
export ANTHROPIC_API_KEY=your-key-here
```

### Test Agent
```python
from agentbench.execution.agent import AnthropicAgent
import asyncio

async def test():
    agent = AnthropicAgent(api_key="your-key")
    # ... setup workspace and task ...
    outcome = await agent.run(workspace, task, "claude-sonnet-4", events)
    print(outcome.patch)

asyncio.run(test())
```

## 🌐 Frontend Development

### Start Frontend Only
```bash
cd apps/web
npm run dev -- --webpack
```

### Build for Production
```bash
cd apps/web
npm run build
```

### Type Check
```bash
cd apps/web
npm run type-check
```

### Lint
```bash
cd apps/web
npm run lint
```

## 📊 Monitoring

### Watch API Logs
```bash
# In terminal running uvicorn, logs appear automatically
# For more detail, use --log-level debug:
uv run uvicorn agentbench.api.main:app --log-level debug --reload
```

### Monitor Database Connections
```sql
-- In psql
SELECT * FROM pg_stat_activity WHERE datname = 'agentbench';
```

### Check Disk Usage
```bash
# Check Docker volumes
docker system df

# Check bundle storage
du -sh ~/.cache/agentbench_bundles
```

## 🔐 Security Checklist

Before deploying:
- [ ] API keys in environment variables (not code)
- [ ] CORS origins configured for production
- [ ] Database password changed from default
- [ ] Docker containers have resource limits
- [ ] File path validation enabled
- [ ] Network access disabled for agent sandboxes

## 🆘 Emergency Commands

### API Won't Start
```bash
# Check port is available
lsof -i :8000

# Kill process on port 8000
kill -9 $(lsof -t -i:8000)
```

### Database Connection Failed
```bash
# Check Postgres is running
docker ps | grep postgres

# Restart Postgres
docker compose restart postgres

# Check connection string in .env
cat .env | grep DATABASE_URL
```

### Migrations Out of Sync
```bash
# Check current version
uv run alembic current

# Check what migrations exist
uv run alembic history

# Reset to specific version
uv run alembic downgrade <revision>
uv run alembic upgrade head
```

### Clean Slate
```bash
# Stop everything
docker compose down
pkill -f uvicorn

# Remove data
rm -rf alembic/versions/*.py
docker volume rm agent-bench_postgres-data

# Start fresh
docker compose up -d postgres
uv run alembic revision --autogenerate -m "initial"
uv run alembic upgrade head
```

---

## 💡 Tips

1. **Use the interactive API docs**: http://127.0.0.1:8000/docs
2. **Keep multiple terminals open**: API, frontend, database
3. **Test incrementally**: Don't wait until everything is done
4. **Read error messages**: They usually tell you exactly what's wrong
5. **Check the logs**: Most problems are obvious in the logs
6. **Use git**: Commit working states so you can roll back

## 📚 Quick Links

- API docs: http://127.0.0.1:8000/docs
- Frontend: http://localhost:3000
- Health check: http://127.0.0.1:8000/health
- Implementation guide: `docs/beginner-implementation-guide.md`
- Roadmap: `docs/implementation-roadmap.md`
- This file: `docs/quick-reference.md`
