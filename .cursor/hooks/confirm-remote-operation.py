#!/usr/bin/env python3
"""Require confirmation before commands that can mutate shared environments."""

import json
import sys


def main() -> None:
    payload = json.load(sys.stdin)
    command = payload.get("command", "remote operation")
    response = {
        "permission": "ask",
        "user_message": (
            "This command can mutate linked Supabase or production Vercel state. "
            "Approve only after confirming the target and rollback plan."
        ),
        "agent_message": (
            f"Before executing `{command}`, state the verified remote target, "
            "the user's authorization, the preflight checks, and the rollback path."
        ),
    }
    print(json.dumps(response))


if __name__ == "__main__":
    main()
