"""Benchmark preparation: Build and validate trusted grading bundles.

This is Step 2 & 3 of the implementation guide.

Step 2 (build): Extract test files from reference commit
Step 3 (validate): Run tests on base and reference to verify they work

Key Concepts:
- Trusted grading bundle: Test files extracted from reference commit
- Base commit: Broken code (tests should fail)
- Reference commit: Fixed code (tests should pass)
- Fail-to-pass (F2P): Tests that fail on base, pass on reference
- Pass-to-pass (P2P): Tests that pass on both (regression detection)
"""

import tempfile
from pathlib import Path
from uuid import UUID

from agentbench.domain.benchmarks import BenchmarkTaskCreate, BenchmarkValidation, TestOutcome
from agentbench.execution.contracts import TrustedGradingBundle
from agentbench.execution.git_repo import BundleBuilder, GitRepository


class DefaultBenchmarkPreparer:
    """Implementation of BenchmarkPreparer protocol.

    This class handles:
    1. Building grading bundles (Step 2)
    2. Validating benchmarks (Step 3)
    """

    def __init__(
        self,
        git_repo: GitRepository | None = None,
        bundle_storage_dir: Path | None = None,
    ):
        """Initialize preparer.

        Args:
            git_repo: GitRepository instance (creates default if None)
            bundle_storage_dir: Where to store bundles (uses temp if None)
        """
        self.git_repo = git_repo or GitRepository()
        self.bundle_builder = BundleBuilder(self.git_repo)
        self.bundle_storage_dir = (
            bundle_storage_dir or Path(tempfile.gettempdir()) / "agentbench_bundles"
        )
        self.bundle_storage_dir.mkdir(parents=True, exist_ok=True)

    async def build(
        self, task_id: UUID, specification: BenchmarkTaskCreate
    ) -> TrustedGradingBundle:
        """Build trusted grading bundle (Step 2).

        This extracts test files from the reference commit and creates
        an immutable bundle with a content hash.

        Args:
            task_id: UUID of the benchmark task
            specification: Task specification with repo, commits, paths

        Returns:
            TrustedGradingBundle with bundle info

        Raises:
            Exception: If bundle building fails

        Implementation Steps:
        1. Extract grading_paths from reference_commit
        2. Exclude reference solution (only tests/fixtures)
        3. Create bundle with manifest
        4. Compute SHA-256 hash
        5. Store bundle
        6. Return TrustedGradingBundle

        TODO: Complete this implementation using BundleBuilder
        """
        # TODO: Use self.bundle_builder to create bundle
        bundle_path, bundle_hash = self.bundle_builder.build_bundle(
            repository_url=str(specification.repository_url),
            reference_commit=specification.reference_commit,
            grading_paths=specification.grading_paths,
            output_dir=self.bundle_storage_dir,
        )

        # Create artifact key (unique identifier for this bundle)
        artifact_key = f"bundles/{task_id}/{bundle_hash}.tar.gz"

        # Return bundle metadata
        return TrustedGradingBundle(
            task_id=task_id,
            artifact_key=artifact_key,
            sha256=bundle_hash,
            grading_paths=tuple(specification.grading_paths),
        )

    async def validate(
        self, specification: BenchmarkTaskCreate, bundle: TrustedGradingBundle
    ) -> BenchmarkValidation:
        """Validate benchmark by running tests (Step 3).

        This verifies that:
        1. Base commit: F2P tests FAIL, P2P tests PASS
        2. Reference commit: F2P tests PASS, P2P tests PASS

        Both use the SAME bundle and SAME environment.

        Args:
            specification: Task specification
            bundle: The grading bundle to use

        Returns:
            BenchmarkValidation with results

        Implementation Steps:
        1. Run tests on base commit with bundle
        2. Run tests on reference commit with bundle
        3. Verify F2P/P2P outcomes match expectations
        4. Return validation result

        TODO: This requires Docker integration (covered in Step 3 skeleton below)

        For now, return a placeholder that you'll implement in Step 3.
        """
        # TODO: Implement validation using Docker
        # This is a placeholder - real implementation needs:
        # 1. Docker container with environment.image
        # 2. Checkout base commit
        # 3. Apply bundle
        # 4. Run test_command
        # 5. Parse results
        # 6. Repeat for reference commit
        # 7. Verify outcomes

        # Placeholder: Return unvalidated status with error
        return BenchmarkValidation(
            status="rejected",
            errors=[
                "Validation not implemented yet - requires Docker integration (Step 3)"
            ],
        )


# Example usage for testing:
if __name__ == "__main__":
    import asyncio
    from uuid import uuid4

    async def test_preparer():
        """Test the preparer with a real repository.

        This is a minimal example to verify Git operations work.
        """
        # Create preparer
        preparer = DefaultBenchmarkPreparer()

        # Create a simple test specification
        # TODO: Replace with a real repository you have access to
        test_spec = BenchmarkTaskCreate(
            title="Test Benchmark",
            repository_url="https://github.com/your-org/your-repo",  # CHANGE THIS
            base_commit="base_commit_sha_here",  # CHANGE THIS
            reference_commit="reference_commit_sha_here",  # CHANGE THIS
            prompt="Fix the failing test",
            grading_paths=["tests/test_example.py"],
            fail_to_pass=["test_example::test_something"],
            pass_to_pass=[],
            test_command=["pytest", "tests/"],
            environment={
                "image": "python:3.12@sha256:...",  # Docker image with digest
                "setup_commands": [],
            },
        )

        try:
            # Build bundle
            print("Building bundle...")
            bundle = await preparer.build(uuid4(), test_spec)
            print(f"Bundle created: {bundle.sha256}")

            # Validate (will fail with placeholder message)
            print("\nValidating...")
            validation = await preparer.validate(test_spec, bundle)
            print(f"Validation status: {validation.status}")
            if validation.errors:
                print(f"Errors: {validation.errors}")

        except Exception as e:
            print(f"Error: {e}")

    # Run test
    # asyncio.run(test_preparer())
    print("Preparer implementation ready. Uncomment asyncio.run() to test.")
