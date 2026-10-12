# 🚀 START HERE - Your Complete Guide

Welcome! This document is your **one-stop navigation** for implementing AgentBench.

## ⚡ Quick Start (5 Minutes)

```bash
# 1. Install dependencies
uv sync --extra database --extra mcp --extra execution

# 2. Start database
docker compose up -d postgres

# 3. Run migrations
uv run alembic upgrade head

# 4. Start API
uv run uvicorn agentbench.api.main:app --reload --host 127.0.0.1 --port 8000

# 5. Test it works
curl http://127.0.0.1:8000/health
# Should return: {"status":"ok"}

# 6. Open API docs
open http://127.0.0.1:8000/docs
```

**✅ If the above works, you're ready to start implementing!**

---

## 📖 Documentation Index

### 🎯 **Essential Guides**

| Document | Purpose | When to Use |
|----------|---------|-------------|
| [Beginner Implementation Guide](beginner-implementation-guide.md) | Step-by-step for all 7 steps | Read before each step |
| [TODO Guide](TODO-GUIDE.md) | All 61 TODOs explained | Reference while coding |
| [Quick Reference](quick-reference.md) | Command cheat sheet | Daily work |
| [Architecture](architecture.md) | System design | Understanding the big picture |
| [Benchmarking Spec](benchmarking.md) | Formal requirements | Detailed acceptance criteria |

### 📊 **Understanding the Code**

| Topic | Where to Look | What You'll Find |
|-------|---------------|------------------|
| **Database models** | `src/agentbench/db/models.py` | Table definitions |
| **API routes** | `src/agentbench/api/routes/` | HTTP endpoints |
| **Domain contracts** | `src/agentbench/domain/` | Pydantic models |
| **Git operations** | `src/agentbench/execution/git_repo.py` | Clone, extract, bundle |
| **Docker runner** | `src/agentbench/execution/docker_runner.py` | Test execution |
| **Agent integration** | `src/agentbench/execution/agent.py` | LLM integration |

---

## 🎓 Learning Path

### **Week 0: Preparation** ⏱️ 1-2 days

**Goal:** Understand what you're building and verify you're ready

- [ ] Read main [README](../README.md)
  - What's the project about? Do I have the prerequisites?
- [ ] Read [Architecture](architecture.md)
  - How do the pieces fit together?
- [ ] Skim [TODO Guide](TODO-GUIDE.md)
  - What skeleton code exists? What will you implement?
- [ ] Quick start (above) works on my machine

**Done when:** You can start the API and Postgres, and you understand the 7-step plan.

---

### **Week 1: Step 1 - Persistence** ⏱️ Several days

**Goal:** Database works, data persists

**Read:**
- [Beginner Guide - Step 1](beginner-implementation-guide.md#step-1--persist-tasksevaluations)
- [TODO Guide - Step 1](TODO-GUIDE.md#step-1-database-persistence)

**Code:**
- `src/agentbench/db/` - Already complete! ✅
- `src/agentbench/api/routes/` - Already complete! ✅

**Tasks:**
- [ ] Test creating a task via `/docs`
- [ ] Verify it persists (restart API, fetch again)
- [ ] Test 404 handling (get non-existent task)
- [ ] Test 409 handling (create eval on unvalidated task)
- [ ] Update tests in `tests/test_api.py`
- [ ] Run `uv run pytest` - all pass

**Done when:** Checklist in [Beginner Guide Step 1](beginner-implementation-guide.md#done-when-1-acceptance) is complete.

---

### **Week 2-3: Steps 2-3 - Extract & Validate** ⏱️ 1-2 weeks

**Goal:** Bundle extraction and Docker validation work

**Read:**
- [Beginner Guide - Step 2](beginner-implementation-guide.md#step-2--extract-trusted-tests)
- [Beginner Guide - Step 3](beginner-implementation-guide.md#step-3--validate-basereference)
- [TODO Guide - Steps 2-3](TODO-GUIDE.md#step-2-extract-trusted-tests)

**Code:**
- `src/agentbench/execution/git_repo.py` - 90% complete
- `src/agentbench/execution/docker_runner.py` - 85% complete
- `src/agentbench/execution/preparer.py` - 60% complete

**Tasks:**
- [ ] Fill in TODOs in `git_repo.py`
- [ ] Test cloning a real repository
- [ ] Test extracting files from a commit
- [ ] Build your first bundle
- [ ] Install Docker Desktop
- [ ] Fill in TODOs in `docker_runner.py`
- [ ] Test running tests in Docker
- [ ] Implement validation in `preparer.py`
- [ ] Test with a toy repo (2 commits: failing test → passing test)

**Done when:** Can extract bundle and validate a simple benchmark end-to-end.

---

### **Week 4-5: Step 4 - Agent** ⏱️ 1 week+

**Goal:** Agent can solve a simple task

**Read:**
- [Beginner Guide - Step 4](beginner-implementation-guide.md#step-4--run-one-agent)
- [TODO Guide - Step 4](TODO-GUIDE.md#step-4-run-one-agent)
- [Anthropic Tool Use Docs](https://docs.anthropic.com/en/docs/build-with-claude/tool-use)

**Code:**
- `src/agentbench/execution/agent.py` - 70% complete

**Tasks:**
- [ ] Get Anthropic API key
- [ ] Install `anthropic` package
- [ ] Fill in agent loop TODOs
- [ ] Test with simple task (fix obvious bug)
- [ ] Verify patch generation works
- [ ] Add safety checks (see roadmap)

**Done when:** Agent can read files, make changes, and produce a valid patch.

---

### **Week 6: Step 5 - Grading** ⏱️ Several days

**Goal:** Clean grading works

**Read:**
- [Beginner Guide - Step 5](beginner-implementation-guide.md#step-5--grade-cleanly)

**Tasks:**
- [ ] Implement grader function
- [ ] Fresh base checkout
- [ ] Apply candidate patch
- [ ] Apply bundle
- [ ] Run tests
- [ ] Validate results

**Done when:** Can grade a solution in a fresh environment.

---

### **Week 7: Step 6 - UI/MCP** ⏱️ A few days

**Goal:** Frontend connects to real API

**Read:**
- [Beginner Guide - Step 6](beginner-implementation-guide.md#step-6--connect-uimcp)

**Tasks:**
- [ ] Create TypeScript API client
- [ ] Replace demo-provider.tsx
- [ ] Add real API calls
- [ ] Add error handling
- [ ] Test in browser

**Done when:** UI shows real data from API, no fake data.

---

### **Week 8: Step 7 - Testing** ⏱️ A few days

**Goal:** Integration tests pass

**Read:**
- [Beginner Guide - Step 7](beginner-implementation-guide.md#step-7--verify-the-flow)

**Tasks:**
- [ ] Create toy test repository
- [ ] Write integration test
- [ ] Test all acceptance cases
- [ ] CI passes

**Done when:** Full flow works end-to-end with passing tests.

---

## 🆘 When You're Stuck

### **Step 1: Check the Usual Suspects**

```bash
# Is Postgres running?
docker ps | grep postgres

# Is the API running?
curl http://127.0.0.1:8000/health

# Are migrations applied?
uv run alembic current

# Can I connect to DB?
docker exec -it agent-bench-postgres-1 psql -U agentbench -d agentbench
```

### **Step 2: Consult the Docs**

1. **Common issue?** → [Quick Reference - Emergency Commands](quick-reference.md#-emergency-commands)
2. **Command help?** → [Quick Reference](quick-reference.md)
3. **TODO unclear?** → [TODO Guide](TODO-GUIDE.md) - Find your TODO number
4. **Concept unclear?** → [Beginner Guide](beginner-implementation-guide.md)

### **Step 3: Debug Systematically**

1. Read error message carefully
2. Check file paths are correct
3. Look at logs (API console, Docker logs)
4. Try simplest possible test case
5. Search error online

### **Step 4: Ask for Help**

When asking for help, include:
- **What step** you're on (e.g., "Step 2, building bundle")
- **What you tried** (command or code snippet)
- **Error message** (full text)
- **What you've checked** (logs, file paths, etc.)

---

## 📊 Progress Tracker

Use this to track your journey:

```
🎯 Week 0: Preparation
[ ] Read docs
[ ] Understand prerequisites
[ ] Quick start works

✅ Week 1: Step 1 - Persistence
[ ] Create task works
[ ] Data persists
[ ] Tests pass

🔨 Week 2-3: Steps 2-3 - Extract & Validate
[ ] Bundle building works
[ ] Docker tests work
[ ] Validation works

🤖 Week 4-5: Step 4 - Agent
[ ] Agent loop works
[ ] Patch generation works
[ ] Simple task solves

⚖️ Week 6: Step 5 - Grading
[ ] Fresh grading works
[ ] Patch application works

🌐 Week 7: Step 6 - UI/MCP
[ ] API client works
[ ] Real data in UI

🧪 Week 8: Step 7 - Testing
[ ] Integration tests pass
[ ] 🎉 DONE!
```

---

## 🎯 Success Criteria

You'll know you're done when:

- ✅ Can create and persist tasks
- ✅ Can extract test bundles from Git
- ✅ Can validate benchmarks in Docker
- ✅ Can run an agent on a task
- ✅ Can grade solutions fairly
- ✅ UI shows real data
- ✅ Integration tests pass
- ✅ You understand how all pieces fit together

---

## 💡 Pro Tips

1. **Test incrementally** - Don't wait until everything is done
2. **Use the interactive API docs** - http://127.0.0.1:8000/docs
3. **Read the TODO comments** - They have hints
4. **Run the example code** - Bottom of each skeleton file
5. **Keep terminals open** - API, frontend, database
6. **Commit working states** - So you can roll back
7. **Ask specific questions** - "Step X, error Y, tried Z"

---

## 📚 Essential Links

- **Main README**: `../README.md`
- **Quick Start** (this doc): `docs/START-HERE.md`
- **Step-by-step**: `docs/beginner-implementation-guide.md`
- **TODO reference**: `docs/TODO-GUIDE.md`
- **Commands**: `docs/quick-reference.md`
- **Architecture**: `docs/architecture.md`

---

## 🎉 You're Ready!

You have:
- ✅ **Skeleton code** for Steps 1-4 (~2,475 lines)
- ✅ **All 61 TODOs explained** with examples
- ✅ **Step-by-step guide** for all 7 steps
- ✅ **Command reference** for daily work
- ✅ **Clear documentation** for every topic

**Now go build!** 🚀

Start with Week 1 (Step 1 testing), then move forward one week at a time.

Good luck! 🍀
