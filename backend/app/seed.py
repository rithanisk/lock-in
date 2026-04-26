"""Seed script for development data."""

import os
from datetime import datetime, timezone, timedelta

from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

sb = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_ROLE_KEY"])


def seed():
    print("Seeding database...")

    # Create test users via admin API
    users = []
    test_accounts = [
        {"email": "alice@test.edu", "display_name": "Alice Chen"},
        {"email": "bob@test.edu", "display_name": "Bob Kumar"},
        {"email": "carol@test.edu", "display_name": "Carol Zhang"},
    ]

    for account in test_accounts:
        try:
            user = sb.auth.admin.create_user({
                "email": account["email"],
                "password": "testpass123",
                "email_confirm": True,
                "user_metadata": {"display_name": account["display_name"]},
            })
            users.append(user.user)
            print(f"  Created user: {account['email']}")
        except Exception as e:
            print(f"  User {account['email']} may already exist: {e}")
            # Try to fetch existing
            existing = sb.table("profiles").select("id").eq("email", account["email"]).execute()
            if existing.data:
                users.append(type("User", (), {"id": existing.data[0]["id"]})())

    if len(users) < 2:
        print("Need at least 2 users to seed tasks. Exiting.")
        return

    alice, bob = users[0], users[1]

    # Create sample tasks
    deadline = (datetime.now(timezone.utc) + timedelta(days=2)).isoformat()

    tasks_data = [
        {
            "title": "Study 2 hours for CS midterm",
            "description": "Complete chapters 5-7 review and practice problems",
            "category": "study",
            "stake_amount": 10,
            "creator_id": str(alice.id),
            "verifier_id": str(bob.id),
            "status": "active",
            "deadline": deadline,
            "proof_type": "photo",
        },
        {
            "title": "Go for a 30-min run",
            "description": "Run at least 3km",
            "category": "fitness",
            "stake_amount": 5,
            "creator_id": str(bob.id),
            "verifier_id": str(alice.id),
            "status": "active",
            "deadline": deadline,
            "proof_type": "photo",
        },
    ]

    for task in tasks_data:
        sb.table("tasks").insert(task).execute()
        print(f"  Created task: {task['title']}")

    # Create a squad
    squad = sb.table("squads").insert({
        "name": "CS Study Group",
        "description": "Accountability group for CS majors",
        "invite_code": "cs-squad-2024",
        "max_members": 10,
        "creator_id": str(alice.id),
        "pot_balance": 0,
    }).execute()

    squad_id = squad.data[0]["id"]

    for u in users:
        sb.table("squad_members").insert({
            "squad_id": squad_id,
            "user_id": str(u.id),
            "role": "member",
        }).execute()

    print(f"  Created squad: CS Study Group with {len(users)} members")
    print("Seeding complete!")


if __name__ == "__main__":
    seed()
