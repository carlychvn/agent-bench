"""Docker container execution for isolated test runs.

This is Step 3: Run tests in Docker containers to validate benchmarks.

Key Concepts:
- Container: Isolated environment (like a mini computer)
- Image: Template for containers (e.g., python:3.12)
- Volume: Share files between host and container
- docker run: Create and start a container
- JUnit XML: Standard format for test results

Why Docker?:
- Isolated: Tests can't access your filesystem
- Reproducible: Same image = same environment
- Safe: Can limit CPU, memory, network
"""

import json
import subprocess
import tempfile
import xml.etree.ElementTree as ET
from pathlib import Path
from typing import Dict

from agentbench.domain.benchmarks import TestOutcome
from agentbench.execution.contracts import GradeOutcome, TestResult


class DockerRunnerError(Exception):
    """Raised when Docker operations fail."""

    pass


class DockerRunner:
    """Run commands in Docker containers.

    This class handles:
    1. Running test commands in containers
    2. Collecting test results
    3. Parsing JUnit XML output
    4. Managing container lifecycle
    """

    def __init__(self):
        """Initialize Docker runner.

        Raises:
            DockerRunnerError: If Docker is not available
        """
        # Verify Docker is installed
        if not self._is_docker_available():
            raise DockerRunnerError(
                "Docker is not installed or not running. "
                "Install Docker Desktop: https://docs.docker.com/get-docker/"
            )

    def _is_docker_available(self) -> bool:
        """Check if Docker is available.

        Returns:
            True if docker command works, False otherwise
        """
        try:
            result = subprocess.run(
                ["docker", "version"],
                capture_output=True,
                timeout=5,
            )
            return result.returncode == 0
        except Exception:
            return False

    def run_tests(
        self,
        image: str,
        workspace_dir: Path,
        test_command: list[str],
        timeout_seconds: int = 300,
    ) -> GradeOutcome:
        """Run tests in a Docker container.

        Args:
            image: Docker image with SHA256 digest (e.g., python:3.12@sha256:...)
            workspace_dir: Local directory with code to test
            test_command: Command to run tests (e.g., ["pytest", "tests/"])
            timeout_seconds: Maximum time to run (default 5 minutes)

        Returns:
            GradeOutcome with test results

        Raises:
            DockerRunnerError: If container execution fails

        Implementation Steps:
        1. Create temporary directory for output
        2. Run docker with:
           - Volume mount: workspace_dir -> /workspace
           - Working directory: /workspace
           - Command: test_command with JUnit XML output
        3. Capture stdout/stderr
        4. Parse JUnit XML for test results
        5. Return GradeOutcome

        Docker Command Pattern:
        ```bash
        docker run --rm \
          -v /local/workspace:/workspace \
          -w /workspace \
          --network none \
          --memory 2g \
          --cpus 2 \
          python:3.12@sha256:... \
          pytest tests/ --junitxml=/workspace/results.xml
        ```
        """
        # TODO: Implement Docker test execution
        # Create temp directory for results
        with tempfile.TemporaryDirectory() as temp_dir:
            results_file = Path(temp_dir) / "results.xml"

            # Build docker command
            # TODO: Construct docker run command with:
            # - --rm (remove container after run)
            # - -v workspace_dir:/workspace (mount workspace)
            # - -w /workspace (set working directory)
            # - --network none (no network access for security)
            # - --memory 2g --cpus 2 (resource limits)
            # - image
            # - test_command with --junitxml=results.xml appended

            docker_cmd = [
                "docker",
                "run",
                "--rm",  # Remove container after run
                f"--volume={workspace_dir}:/workspace",  # Mount workspace
                "--workdir=/workspace",  # Set working directory
                "--network=none",  # No network access
                "--memory=2g",  # Memory limit
                "--cpus=2",  # CPU limit
                image,  # Docker image
                *test_command,  # Test command
                f"--junitxml={results_file}",  # JUnit output
            ]

            try:
                # Run docker command
                import time

                start_time = time.time()

                result = subprocess.run(
                    docker_cmd,
                    capture_output=True,
                    text=True,
                    timeout=timeout_seconds,
                )

                duration = time.time() - start_time

                # Parse test results from JUnit XML
                tests = self._parse_junit_xml(results_file) if results_file.exists() else ()

                return GradeOutcome(
                    exit_code=result.returncode,
                    stdout=result.stdout,
                    stderr=result.stderr,
                    duration_seconds=duration,
                    tests=tests,
                )

            except subprocess.TimeoutExpired:
                raise DockerRunnerError(f"Tests timed out after {timeout_seconds}s")
            except Exception as e:
                raise DockerRunnerError(f"Docker execution failed: {e}")

    def _parse_junit_xml(self, junit_file: Path) -> tuple[TestResult, ...]:
        """Parse JUnit XML file to extract test results.

        JUnit XML Format:
        ```xml
        <testsuites>
          <testsuite name="tests" tests="3">
            <testcase classname="test_foo" name="test_bar" />
            <testcase classname="test_foo" name="test_baz">
              <failure message="assertion failed">...</failure>
            </testcase>
            <testcase classname="test_foo" name="test_skip">
              <skipped />
            </testcase>
          </testsuite>
        </testsuites>
        ```

        Args:
            junit_file: Path to JUnit XML results file

        Returns:
            Tuple of TestResult objects

        Implementation Guide:
        1. Parse XML file
        2. Find all <testcase> elements
        3. For each test case:
           - Extract test ID (classname::name)
           - Determine outcome:
             - Has <failure>? -> FAILED
             - Has <error>? -> ERROR
             - Has <skipped>? -> SKIPPED
             - Otherwise -> PASSED
        4. Return tuple of TestResult objects
        """
        if not junit_file.exists():
            return ()

        try:
            tree = ET.parse(junit_file)
            root = tree.getroot()

            results = []

            # TODO: Parse all <testcase> elements
            for testcase in root.iter("testcase"):
                # Extract test ID
                classname = testcase.get("classname", "")
                name = testcase.get("name", "")
                test_id = f"{classname}::{name}"

                # Determine outcome
                if testcase.find("failure") is not None:
                    outcome = TestOutcome.FAILED
                elif testcase.find("error") is not None:
                    outcome = TestOutcome.ERROR
                elif testcase.find("skipped") is not None:
                    outcome = TestOutcome.SKIPPED
                else:
                    outcome = TestOutcome.PASSED

                results.append(TestResult(test_id=test_id, outcome=outcome))

            return tuple(results)

        except Exception as e:
            # If parsing fails, return empty results (don't crash)
            print(f"Warning: Failed to parse JUnit XML: {e}")
            return ()

    def prepare_workspace(
        self, repo_path: Path, commit_sha: str, bundle_dir: Path, output_dir: Path
    ) -> Path:
        """Prepare a workspace for testing.

        This creates a directory with:
        1. Code checked out at commit_sha
        2. Test bundle overlaid on top

        Args:
            repo_path: Local git repository
            commit_sha: Commit to checkout
            bundle_dir: Directory with test bundle
            output_dir: Where to create workspace

        Returns:
            Path to prepared workspace

        Implementation Steps:
        1. Create workspace directory
        2. Checkout code at commit_sha
        3. Copy bundle files over code
        4. Return workspace path

        TODO: Implement workspace preparation
        This needs git archive or git worktree to extract commit
        """
        workspace = output_dir / f"workspace_{commit_sha[:8]}"
        workspace.mkdir(parents=True, exist_ok=True)

        # TODO: Use 'git archive' to extract commit
        # git archive --format=tar <sha> | tar -x -C /workspace

        # TODO: Copy bundle files on top
        # This overlays test files from bundle onto the workspace

        # For now, return empty workspace (you'll implement this in Step 3)
        return workspace


# Example usage for testing:
if __name__ == "__main__":

    def test_docker_runner():
        """Test Docker runner with a simple Python test."""
        runner = DockerRunner()

        # Create a minimal test workspace
        with tempfile.TemporaryDirectory() as temp_dir:
            workspace = Path(temp_dir)

            # Write a simple test file
            test_file = workspace / "test_example.py"
            test_file.write_text(
                """
def test_pass():
    assert True

def test_fail():
    assert False
"""
            )

            # Run tests
            try:
                print("Running tests in Docker...")
                outcome = runner.run_tests(
                    image="python:3.12-slim",  # Use slim image for speed
                    workspace_dir=workspace,
                    test_command=["python", "-m", "pytest", "-v"],
                    timeout_seconds=60,
                )

                print(f"Exit code: {outcome.exit_code}")
                print(f"Duration: {outcome.duration_seconds:.2f}s")
                print(f"Tests found: {len(outcome.tests)}")

                for test in outcome.tests:
                    print(f"  {test.test_id}: {test.outcome}")

            except DockerRunnerError as e:
                print(f"Error: {e}")

    # Uncomment to test
    # test_docker_runner()
    print("DockerRunner implementation ready. Uncomment test_docker_runner() to test.")
