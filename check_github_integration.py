"""Read-only smoke test for this project's GitHub connection."""

import os
import subprocess
import sys


OWNER = "InTrainTech"
REPOSITORY = "Arthrex_110ct"
def check_origin() -> bool:
    result = subprocess.run(
        ["git", "remote", "get-url", "origin"],
        capture_output=True,
        check=False,
        text=True,
    )
    if result.returncode != 0:
        print("FAIL: Git origin remote is not configured.")
        return False

    remote = result.stdout.strip().removesuffix(".git").rstrip("/").lower()
    expected_remotes = {
        f"https://github.com/{OWNER}/{REPOSITORY}".lower(),
        f"git@github.com:{OWNER}/{REPOSITORY}".lower(),
    }
    if remote not in expected_remotes:
        print("FAIL: Git origin does not point to the expected GitHub repository.")
        return False

    print("PASS: Git origin points to the expected repository.")
    return True


def check_git_connection() -> bool:
    result = subprocess.run(
        ["git", "ls-remote", "origin", "refs/heads/main"],
        capture_output=True,
        check=False,
        text=True,
    )
    if result.returncode != 0:
        print("FAIL: Could not read the main branch from GitHub.")
        return False

    print("PASS: Git can connect to the GitHub repository.")
    return True


def check_push_permission() -> bool:
    environment = os.environ.copy()
    environment["GIT_TERMINAL_PROMPT"] = "0"
    result = subprocess.run(
        ["git", "push", "--dry-run", "origin", "HEAD:refs/heads/main"],
        capture_output=True,
        check=False,
        env=environment,
        text=True,
    )
    if result.returncode != 0:
        print("FAIL: GitHub rejected the dry-run push; check the saved account's write access.")
        return False

    print("PASS: GitHub accepted a dry-run push to main (no changes were sent).")
    return True


def main() -> int:
    origin_ok = check_origin()
    connection_ok = check_git_connection() if origin_ok else False
    push_ok = check_push_permission() if origin_ok and connection_ok else False
    return 0 if origin_ok and connection_ok and push_ok else 1


if __name__ == "__main__":
    sys.exit(main())