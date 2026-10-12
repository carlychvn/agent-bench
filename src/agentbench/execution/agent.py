"""AI agent integration for solving coding tasks.

This is Step 4: Run an agent with base-only information.

Key Concepts:
- Agent: AI model that attempts to fix bugs/complete tasks
- Sandbox: Isolated environment where agent runs
- Base-only: Agent only sees broken code, not the fix
- Tools: Functions agent can call (read file, write file, run command)
- Prompt: Instructions telling agent what to do

Security:
- Agent MUST NOT see reference commit (the solution)
- Agent MUST NOT see test files (those are hidden for grading)
- Agent MUST NOT access network (prevent data exfiltration)
- Capture all changes as a patch
"""

import subprocess
from pathlib import Path
from uuid import UUID

from agentbench.execution.contracts import AgentOutcome, AgentTask, EventSink, Workspace


class AnthropicAgent:
    """AI coding agent using Anthropic's Claude API.

    This agent:
    1. Receives a task (repo + prompt)
    2. Has access to tools (read/write files, run commands)
    3. Iteratively works toward a solution
    4. Returns final code changes as a patch

    Tool calling flow:
    ```
    Agent: "Let me read the failing test"
    -> read_file("tests/test_foo.py")
    -> Returns file content

    Agent: "I see the issue, let me fix it"
    -> write_file("src/foo.py", "fixed code...")
    -> File updated

    Agent: "Let me verify my fix"
    -> run_command(["pytest", "tests/test_foo.py"])
    -> Returns test output

    Agent: "Done!"
    -> Generate patch of changes
    ```
    """

    def __init__(self, api_key: str):
        """Initialize Anthropic agent.

        Args:
            api_key: Anthropic API key (from environment or config)

        TODO: Add anthropic package to dependencies
        pip install anthropic
        """
        self.api_key = api_key
        # TODO: Initialize Anthropic client
        # from anthropic import Anthropic
        # self.client = Anthropic(api_key=api_key)

    async def run(
        self, workspace: Workspace, task: AgentTask, model: str, events: EventSink
    ) -> AgentOutcome:
        """Run agent on a task.

        Args:
            workspace: Sandbox workspace with base code
            task: Task description (what to fix)
            model: Model identifier (e.g., "claude-sonnet-4")
            events: Event sink for logging actions

        Returns:
            AgentOutcome with patch and token usage

        Implementation Steps:
        1. Build system prompt (task description + available tools)
        2. Start agentic loop:
           a. Send message to LLM
           b. LLM responds with tool calls or final answer
           c. Execute tools in workspace
           d. Send results back to LLM
           e. Repeat until done or max iterations
        3. Generate patch of all changes
        4. Return AgentOutcome

        TODO: Implement using Anthropic SDK
        See: https://docs.anthropic.com/en/docs/build-with-claude/tool-use
        """
        # TODO: Implement agent loop
        # For now, return placeholder

        # Emit event that agent is starting
        await events.emit(
            workspace.run_id,
            "agent_started",
            {"model": model, "workspace": str(workspace.path)},
        )

        # TODO: Build system prompt
        system_prompt = self._build_system_prompt(task)

        # TODO: Define tools (read_file, write_file, run_command)
        tools = self._define_tools()

        # TODO: Agent loop (see skeleton below)
        # max_iterations = 10
        # for i in range(max_iterations):
        #     response = await self._call_llm(system_prompt, tools)
        #     if response has tool calls:
        #         results = self._execute_tools(response.tool_calls, workspace)
        #         continue conversation with results
        #     else:
        #         break (agent is done)

        # TODO: Generate patch
        patch = self._generate_patch(workspace)

        # Emit completion event
        await events.emit(
            workspace.run_id,
            "agent_completed",
            {"patch_size": len(patch)},
        )

        return AgentOutcome(
            patch=patch,
            input_tokens=None,  # TODO: Get from LLM response
            output_tokens=None,  # TODO: Get from LLM response
            cost_usd=None,  # TODO: Calculate based on token usage
        )

    def _build_system_prompt(self, task: AgentTask) -> str:
        """Build system prompt for the agent.

        The prompt should:
        1. Explain the task
        2. List available tools
        3. Set expectations (fix the bug, pass tests)
        4. Provide guidelines (be systematic, explain changes)

        Args:
            task: Task to work on

        Returns:
            System prompt string
        """
        return f"""You are an expert software engineer debugging code.

Repository: {task.repository_url}
Base commit: {task.base_commit}

Task:
{task.prompt}

Available tools:
- read_file(path): Read a file from the workspace
- write_file(path, content): Write/update a file
- run_command(command): Run a shell command (e.g., run tests)
- list_files(directory): List files in a directory

Guidelines:
1. Start by exploring the codebase
2. Read relevant files to understand the problem
3. Make targeted changes to fix the issue
4. Verify your fix by running tests
5. Be systematic and explain your reasoning

When you're done, say "DONE" and I'll capture your changes.
"""

    def _define_tools(self) -> list[dict]:
        """Define tools available to the agent.

        Tools follow Anthropic's tool schema:
        https://docs.anthropic.com/en/docs/build-with-claude/tool-use

        Returns:
            List of tool definitions
        """
        return [
            {
                "name": "read_file",
                "description": "Read the contents of a file",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "path": {
                            "type": "string",
                            "description": "Path to file (relative to workspace root)",
                        }
                    },
                    "required": ["path"],
                },
            },
            {
                "name": "write_file",
                "description": "Write or update a file",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "path": {"type": "string", "description": "File path"},
                        "content": {"type": "string", "description": "File content"},
                    },
                    "required": ["path", "content"],
                },
            },
            {
                "name": "run_command",
                "description": "Run a shell command in the workspace",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "command": {
                            "type": "array",
                            "items": {"type": "string"},
                            "description": "Command and arguments",
                        }
                    },
                    "required": ["command"],
                },
            },
        ]

    def _execute_tool(self, tool_name: str, tool_input: dict, workspace: Workspace) -> str:
        """Execute a tool call in the workspace.

        Args:
            tool_name: Name of tool (read_file, write_file, etc.)
            tool_input: Tool parameters
            workspace: Workspace to operate in

        Returns:
            Tool result as string

        TODO: Implement tool execution with safety checks
        """
        if tool_name == "read_file":
            # TODO: Read file from workspace
            path = Path(workspace.path) / tool_input["path"]
            if not path.exists():
                return f"Error: File {tool_input['path']} not found"
            return path.read_text()

        elif tool_name == "write_file":
            # TODO: Write file to workspace
            # Security: Validate path to prevent directory traversal
            path = Path(workspace.path) / tool_input["path"]
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(tool_input["content"])
            return f"File {tool_input['path']} updated"

        elif tool_name == "run_command":
            # TODO: Run command in workspace
            # Security: Timeout, no network, resource limits
            try:
                result = subprocess.run(
                    tool_input["command"],
                    cwd=workspace.path,
                    capture_output=True,
                    text=True,
                    timeout=30,
                )
                return f"Exit code: {result.returncode}\n{result.stdout}\n{result.stderr}"
            except subprocess.TimeoutExpired:
                return "Error: Command timed out"

        else:
            return f"Error: Unknown tool {tool_name}"

    def _generate_patch(self, workspace: Workspace) -> str:
        """Generate unified diff patch of all changes.

        This captures what the agent changed so we can:
        1. Review the changes
        2. Apply them to a fresh workspace for grading
        3. Store them for analysis

        Args:
            workspace: Workspace with agent's changes

        Returns:
            Unified diff patch

        TODO: Use git diff to generate patch
        Git tracks all changes automatically if workspace is a git repo
        """
        try:
            # TODO: Generate diff using git
            # git diff > patch.diff
            result = subprocess.run(
                ["git", "diff"],
                cwd=workspace.path,
                capture_output=True,
                text=True,
                timeout=10,
            )
            return result.stdout
        except Exception as e:
            return f"Error generating patch: {e}"


class OpenAIAgent:
    """Alternative agent using OpenAI's API.

    Same interface as AnthropicAgent but uses OpenAI models.

    TODO: Implement if you want to support multiple LLM providers
    This follows the same pattern as AnthropicAgent above.
    """

    def __init__(self, api_key: str):
        self.api_key = api_key
        # TODO: Initialize OpenAI client

    async def run(
        self, workspace: Workspace, task: AgentTask, model: str, events: EventSink
    ) -> AgentOutcome:
        # TODO: Implement using OpenAI SDK
        # See: https://platform.openai.com/docs/guides/function-calling
        raise NotImplementedError("OpenAI agent not implemented yet")


# Example usage:
if __name__ == "__main__":
    import asyncio

    async def test_agent():
        """Test agent with a simple task."""
        # TODO: Set your API key
        # agent = AnthropicAgent(api_key="your-key-here")

        # Create test workspace
        import tempfile

        with tempfile.TemporaryDirectory() as temp_dir:
            workspace = Workspace(
                run_id=UUID("00000000-0000-0000-0000-000000000000"),
                path=Path(temp_dir),
                commit_sha="base123",
            )

            # Create simple broken code
            (workspace.path / "broken.py").write_text(
                """
def add(a, b):
    return a - b  # Bug: should be +
"""
            )

            task = AgentTask(
                repository_url="https://github.com/example/repo",
                base_commit="base123",
                prompt="Fix the add function - it's subtracting instead of adding",
            )

            # TODO: Run agent
            # outcome = await agent.run(workspace, task, "claude-sonnet-4", ...)
            # print(f"Patch:\n{outcome.patch}")

    # Uncomment to test
    # asyncio.run(test_agent())
    print("Agent implementation ready. See TODO comments for next steps.")
