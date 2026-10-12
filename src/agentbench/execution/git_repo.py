"""Git repository handling for benchmark preparation.

This module handles cloning repositories and extracting files at specific commits.

Key Concepts:
- Clone: Download a Git repository from GitHub
- Commit/SHA: A specific snapshot in Git history (40 hex characters)
- git show: Extract file contents at a specific commit
- Shallow clone: Only download recent history (faster, smaller)

Security Considerations:
- Only clone from GitHub HTTPS URLs (validated in domain model)
- Validate file paths to prevent directory traversal attacks
- Never execute untrusted code during extraction
"""

import hashlib
import subprocess
import tempfile
from pathlib import Path
from typing import Dict


class GitRepositoryError(Exception):
    """Raised when Git operations fail."""

    pass


class GitRepository:
    """Handle Git repository operations for benchmark preparation.

    This class provides methods to:
    1. Clone repositories
    2. Verify commits exist
    3. Extract files at specific commits
    4. Validate file paths for security
    """

    def __init__(self, cache_dir: Path | None = None):
        """Initialize Git repository handler.

        Args:
            cache_dir: Directory to cache cloned repositories (optional)
                      If None, uses temporary directory
        """
        self.cache_dir = cache_dir or Path(tempfile.gettempdir()) / "agentbench_repos"
        self.cache_dir.mkdir(parents=True, exist_ok=True)

    def _get_repo_cache_path(self, repository_url: str) -> Path:
        """Get local cache path for a repository.

        Args:
            repository_url: GitHub repository URL (e.g., https://github.com/owner/repo)

        Returns:
            Path to local cache directory for this repo
        """
        # Create a safe directory name from the URL
        # Example: https://github.com/owner/repo -> owner_repo
        repo_name = repository_url.rstrip("/").split("/")[-2:]  # ['owner', 'repo']
        safe_name = "_".join(repo_name)
        return self.cache_dir / safe_name

    def clone_or_update(self, repository_url: str) -> Path:
        """Clone repository or update if already cached.

        Args:
            repository_url: GitHub HTTPS URL

        Returns:
            Path to local repository

        Raises:
            GitRepositoryError: If clone/update fails

        Implementation Guide:
        1. Check if repo already exists in cache
        2. If yes: git fetch to update
        3. If no: git clone
        4. Return path to local repo
        """
        repo_path = self._get_repo_cache_path(repository_url)

        try:
            if repo_path.exists():
                # Repository already cached, update it
                # TODO: Run 'git fetch --all' to get latest commits
                result = subprocess.run(
                    ["git", "fetch", "--all"],
                    cwd=repo_path,
                    capture_output=True,
                    text=True,
                    timeout=60,
                )
                if result.returncode != 0:
                    raise GitRepositoryError(f"Git fetch failed: {result.stderr}")
            else:
                # Clone repository for first time
                # TODO: Run 'git clone <url> <path>'
                # Use --bare for efficiency (we only need to read files)
                result = subprocess.run(
                    ["git", "clone", "--bare", repository_url, str(repo_path)],
                    capture_output=True,
                    text=True,
                    timeout=300,  # 5 minutes max for clone
                )
                if result.returncode != 0:
                    raise GitRepositoryError(f"Git clone failed: {result.stderr}")

            return repo_path

        except subprocess.TimeoutExpired as e:
            raise GitRepositoryError(f"Git operation timed out: {e}")
        except Exception as e:
            raise GitRepositoryError(f"Git operation failed: {e}")

    def verify_commit_exists(self, repo_path: Path, commit_sha: str) -> bool:
        """Verify that a commit exists in the repository.

        Args:
            repo_path: Path to local git repository
            commit_sha: 40-character commit SHA

        Returns:
            True if commit exists, False otherwise

        Implementation Guide:
        1. Run 'git cat-file -t <sha>' to check if commit exists
        2. Return True if exit code is 0, False otherwise
        """
        try:
            # TODO: Run git cat-file to check if commit exists
            result = subprocess.run(
                ["git", "cat-file", "-t", commit_sha],
                cwd=repo_path,
                capture_output=True,
                timeout=10,
            )
            return result.returncode == 0
        except Exception:
            return False

    def get_file_content(self, repo_path: Path, commit_sha: str, file_path: str) -> bytes:
        """Extract file content at a specific commit.

        Args:
            repo_path: Path to local git repository
            commit_sha: Commit SHA to extract from
            file_path: Repository-relative path (e.g., "tests/test_foo.py")

        Returns:
            File content as bytes

        Raises:
            GitRepositoryError: If file doesn't exist at that commit

        Implementation Guide:
        1. Validate file_path for security (no .., no absolute paths)
        2. Run 'git show <sha>:<path>' to get file content
        3. Return the output as bytes
        """
        # Security: Validate file path
        if not self._is_safe_path(file_path):
            raise GitRepositoryError(f"Unsafe file path: {file_path}")

        try:
            # TODO: Use git show to extract file content
            # Format: git show <commit>:<path>
            result = subprocess.run(
                ["git", "show", f"{commit_sha}:{file_path}"],
                cwd=repo_path,
                capture_output=True,
                timeout=30,
            )

            if result.returncode != 0:
                raise GitRepositoryError(
                    f"File {file_path} not found at commit {commit_sha}: {result.stderr.decode()}"
                )

            return result.stdout

        except subprocess.TimeoutExpired:
            raise GitRepositoryError(f"Timeout extracting file: {file_path}")
        except Exception as e:
            raise GitRepositoryError(f"Failed to extract file {file_path}: {e}")

    def list_files_at_commit(self, repo_path: Path, commit_sha: str) -> list[str]:
        """List all files in repository at a specific commit.

        Args:
            repo_path: Path to local git repository
            commit_sha: Commit SHA

        Returns:
            List of file paths (repository-relative)

        Implementation Guide:
        1. Run 'git ls-tree -r --name-only <sha>' to list files
        2. Parse output (one file per line)
        3. Return as list
        """
        try:
            # TODO: Use git ls-tree to list all files
            result = subprocess.run(
                ["git", "ls-tree", "-r", "--name-only", commit_sha],
                cwd=repo_path,
                capture_output=True,
                text=True,
                timeout=30,
            )

            if result.returncode != 0:
                raise GitRepositoryError(f"Failed to list files: {result.stderr}")

            # Parse output (one file per line)
            files = [line.strip() for line in result.stdout.splitlines() if line.strip()]
            return files

        except Exception as e:
            raise GitRepositoryError(f"Failed to list files at {commit_sha}: {e}")

    def _is_safe_path(self, path: str) -> bool:
        """Validate that a file path is safe (no directory traversal).

        Security checks:
        - No '..' components
        - No absolute paths
        - No special characters that could escape
        - No .git directory access

        Args:
            path: File path to validate

        Returns:
            True if safe, False otherwise
        """
        # TODO: Implement security checks
        # Hints:
        # - Check for '..' in path
        # - Check if path starts with '/'
        # - Check if path contains '.git'
        # - Use Path.resolve() to normalize and verify

        # Convert to Path for validation
        try:
            p = Path(path)

            # Check for absolute paths
            if p.is_absolute():
                return False

            # Check for parent directory references (..)
            if ".." in p.parts:
                return False

            # Check for .git directory
            if ".git" in p.parts:
                return False

            # Check for suspicious characters
            if any(char in str(path) for char in ["\0", "\\"]):
                return False

            return True

        except Exception:
            return False


class BundleBuilder:
    """Build trusted grading bundles from Git repositories.

    A bundle contains:
    - Test files and fixtures from grading_paths
    - Manifest with file hashes
    - Overall bundle hash for integrity

    Security:
    - Only includes files from approved grading_paths
    - No reference solution code
    - Immutable once created
    """

    def __init__(self, git_repo: GitRepository):
        """Initialize bundle builder.

        Args:
            git_repo: GitRepository instance for extracting files
        """
        self.git_repo = git_repo

    def build_bundle(
        self,
        repository_url: str,
        reference_commit: str,
        grading_paths: list[str],
        output_dir: Path,
    ) -> tuple[Path, str]:
        """Build a grading bundle from approved test paths.

        Args:
            repository_url: GitHub repository URL
            reference_commit: Commit SHA to extract tests from
            grading_paths: List of approved test/fixture paths
            output_dir: Directory to write bundle to

        Returns:
            Tuple of (bundle_path, bundle_sha256)

        Implementation Steps:
        1. Clone/update repository
        2. Verify reference commit exists
        3. Extract files from grading_paths
        4. Create manifest with file hashes
        5. Create tarball
        6. Compute bundle SHA-256
        7. Return path and hash

        Raises:
            GitRepositoryError: If any step fails
        """
        # TODO: Implement bundle building
        # Step 1: Clone/update repository
        repo_path = self.git_repo.clone_or_update(repository_url)

        # Step 2: Verify commit exists
        if not self.git_repo.verify_commit_exists(repo_path, reference_commit):
            raise GitRepositoryError(f"Reference commit {reference_commit} not found")

        # Step 3: Extract files from grading_paths
        bundle_files: Dict[str, bytes] = {}
        for path in grading_paths:
            try:
                content = self.git_repo.get_file_content(repo_path, reference_commit, path)
                bundle_files[path] = content
            except GitRepositoryError as e:
                # Log warning but continue (file might not exist, which is ok)
                print(f"Warning: Could not extract {path}: {e}")

        if not bundle_files:
            raise GitRepositoryError("No files extracted from grading_paths")

        # Step 4: Create manifest with file hashes
        manifest = self._create_manifest(bundle_files)

        # Step 5: Create tarball (simplified - just save files for now)
        # TODO: In production, create a proper .tar.gz archive
        bundle_dir = output_dir / f"bundle_{reference_commit[:8]}"
        bundle_dir.mkdir(parents=True, exist_ok=True)

        for path, content in bundle_files.items():
            file_path = bundle_dir / path
            file_path.parent.mkdir(parents=True, exist_ok=True)
            file_path.write_bytes(content)

        # Save manifest
        manifest_path = bundle_dir / "manifest.json"
        import json

        manifest_path.write_text(json.dumps(manifest, indent=2))

        # Step 6: Compute bundle SHA-256
        bundle_hash = self._compute_bundle_hash(manifest)

        return bundle_dir, bundle_hash

    def _create_manifest(self, files: Dict[str, bytes]) -> dict:
        """Create manifest with file hashes.

        Args:
            files: Dictionary of {path: content}

        Returns:
            Manifest dictionary with file hashes
        """
        manifest = {"files": {}}

        for path, content in files.items():
            file_hash = hashlib.sha256(content).hexdigest()
            manifest["files"][path] = {
                "sha256": file_hash,
                "size": len(content),
            }

        return manifest

    def _compute_bundle_hash(self, manifest: dict) -> str:
        """Compute deterministic hash of entire bundle.

        Args:
            manifest: Bundle manifest

        Returns:
            SHA-256 hash of manifest (hex string)
        """
        import json

        # Serialize manifest with sorted keys for determinism
        canonical = json.dumps(manifest, sort_keys=True)
        return hashlib.sha256(canonical.encode()).hexdigest()
