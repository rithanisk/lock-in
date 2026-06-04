"""Seed script for development data."""

import os
import random
from datetime import datetime, timezone, timedelta

from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

url = os.environ.get("SUPABASE_PROJECT_URL") or os.environ.get("SUPABASE_URL")
sb = create_client(url, os.environ["SUPABASE_SERVICE_ROLE_KEY"])

NOW = datetime.now(timezone.utc)

TEST_ACCOUNTS = [
    {"email": "alice@test.edu",   "display_name": "Alice Chen",      "university": "MIT"},
    {"email": "bob@test.edu",     "display_name": "Bob Kumar",       "university": "Stanford"},
    {"email": "carol@test.edu",   "display_name": "Carol Zhang",     "university": "Harvard"},
    {"email": "dan@test.edu",     "display_name": "Dan Okafor",      "university": "UCLA"},
    {"email": "emma@test.edu",    "display_name": "Emma Patel",      "university": "NYU"},
    {"email": "felix@test.edu",   "display_name": "Felix Nguyen",    "university": "Berkeley"},
    {"email": "grace@test.edu",   "display_name": "Grace Kim",       "university": "Columbia"},
    {"email": "hiro@test.edu",    "display_name": "Hiro Tanaka",     "university": "UChicago"},
    {"email": "isla@test.edu",    "display_name": "Isla Fernandez",  "university": "Princeton"},
    {"email": "jack@test.edu",    "display_name": "Jack Morris",     "university": "Yale"},
    {"email": "kai@test.edu",     "display_name": "Kai Washington",  "university": "Duke"},
    {"email": "luna@test.edu",    "display_name": "Luna Rossi",      "university": "Cornell"},
]

TASK_TEMPLATES = [
    # (title, description, category, proof_type)
    ("Study 2 hours for CS midterm", "Complete chapters 5-7 and practice problems", "study", "photo"),
    ("Go for a 30-min run", "Run at least 3km, screenshot from fitness app", "fitness", "photo"),
    ("Meditate for 20 minutes", "Use Headspace or Calm, show completion screen", "wellness", "photo"),
    ("Finish problem set 3", "All 8 problems, submit before deadline", "study", "photo"),
    ("Hit the gym - leg day", "Squats, lunges, leg press. Show gym check-in.", "fitness", "photo"),
    ("Read 30 pages of textbook", "Economics chapter 4-5", "study", "text"),
    ("No social media for 24h", "Screen time screenshot showing 0 mins on socials", "wellness", "photo"),
    ("Write 500 words of essay", "Rough draft for history paper", "study", "text"),
    ("Cook a healthy meal", "No takeout, post a photo of your meal", "wellness", "photo"),
    ("Attend every class this week", "Screenshot of attendance or selfie in lecture", "productivity", "photo"),
    ("Complete online coding challenge", "Finish LeetCode medium problem", "study", "photo"),
    ("10k steps today", "Share screenshot from health app", "fitness", "photo"),
    ("Clean and organise desk", "Before and after photo", "productivity", "photo"),
    ("Cold shower for 5 days straight", "Day 1 - photo proof each day", "wellness", "photo"),
    ("Submit internship application", "Screenshot of submitted application", "productivity", "photo"),
    ("Practice guitar for 1 hour", "Record a short video clip", "custom", "photo"),
    ("Drink 2L water daily for a week", "Track via app, share screenshot", "wellness", "photo"),
    ("Finish React tutorial", "Screenshot of completed project", "study", "photo"),
    ("Wake up before 7am for 5 days", "Selfie with timestamp each morning", "productivity", "photo"),
    ("Go to bed before midnight", "Screenshot of sleep tracker", "wellness", "photo"),
]


def ensure_profile(uid: str, account: dict):
    """Insert a profile row if one doesn't already exist."""
    try:
        existing = sb.table("profiles").select("id").eq("id", uid).execute()
        if existing.data:
            return  # already exists
    except Exception:
        pass
    try:
        sb.table("profiles").insert({
            "id": uid,
            "display_name": account["display_name"],
            "email": account["email"],
            "university": account.get("university"),
            "balance": 100,
        }).execute()
        # welcome bonus transaction
        sb.table("transactions").insert({
            "user_id": uid,
            "amount": 100,
            "type": "welcome_bonus",
            "description": "Welcome to LockIn! Here are your starting LockCoins.",
        }).execute()
    except Exception as e:
        print(f"  Profile insert failed for {account['email']}: {e}")


def get_or_create_users():
    # Fetch all existing auth users via admin API
    existing_by_email = {}
    try:
        page = sb.auth.admin.list_users()
        for u in page:
            if u.email:
                existing_by_email[u.email] = str(u.id)
    except Exception as e:
        print(f"  Warning: could not list existing users: {e}")

    users = []
    for account in TEST_ACCOUNTS:
        email = account["email"]
        if email in existing_by_email:
            uid = existing_by_email[email]
            ensure_profile(uid, account)
            users.append(uid)
            print(f"  Found/backfilled user: {email}")
        else:
            try:
                user = sb.auth.admin.create_user({
                    "email": email,
                    "password": "testpass123",
                    "email_confirm": True,
                    "user_metadata": {"display_name": account["display_name"]},
                })
                uid = str(user.user.id)
                # trigger may or may not fire depending on timing; ensure profile exists
                ensure_profile(uid, account)
                users.append(uid)
                print(f"  Created user: {email}")
            except Exception as e:
                print(f"  Failed to create {email}: {e}")
    return users


def seed_tasks(user_ids):
    statuses = [
        "pending_acceptance", "pending_acceptance",
        "active", "active", "active", "active",
        "proof_submitted",
        "completed", "completed", "completed",
        "failed",
        "expired",
        "declined",
    ]

    created = 0
    for i, template in enumerate(TASK_TEMPLATES):
        title, desc, category, proof_type = template
        creator = user_ids[i % len(user_ids)]
        verifier = user_ids[(i + 1 + random.randint(1, 4)) % len(user_ids)]
        if verifier == creator:
            verifier = user_ids[(user_ids.index(creator) + 1) % len(user_ids)]

        status = statuses[i % len(statuses)]
        stake = random.choice([5, 10, 15, 20, 25, 30, 50])

        if status in ("completed", "failed", "expired"):
            deadline = (NOW - timedelta(days=random.randint(1, 7))).isoformat()
        elif status == "declined":
            deadline = (NOW + timedelta(days=1)).isoformat()
        else:
            deadline = (NOW + timedelta(days=random.randint(1, 14))).isoformat()

        task = {
            "title": title,
            "description": desc,
            "category": category,
            "stake_amount": stake,
            "creator_id": creator,
            "verifier_id": verifier,
            "status": status,
            "deadline": deadline,
            "proof_type": proof_type,
        }

        if status in ("proof_submitted", "completed"):
            task["proof_text"] = "Here is my proof - completed as required!"
            task["submitted_at"] = (NOW - timedelta(hours=random.randint(1, 48))).isoformat()

        if status == "completed":
            task["verified_at"] = (NOW - timedelta(hours=random.randint(1, 12))).isoformat()

        try:
            sb.table("tasks").insert(task).execute()
            created += 1
        except Exception as e:
            print(f"  Task insert failed ({title}): {e}")

    print(f"  Created {created} tasks")


def seed_transactions(user_ids):
    tx_templates = [
        ("stake_lock", -10, "Stake locked for task: Study 2 hours for CS midterm"),
        ("stake_return", 10, "Stake returned - task completed: Go for a 30-min run"),
        ("stake_forfeit", -15, "Stake forfeited - task failed: Meditate for 20 minutes"),
        ("forfeit_received", 15, "Received forfeit from failed task"),
        ("stake_lock", -20, "Stake locked for task: Finish problem set 3"),
        ("stake_return", 20, "Stake returned - task completed: Hit the gym"),
        ("stake_forfeit", -5, "Stake forfeited - task expired"),
        ("stake_lock", -25, "Stake locked for task: Write 500 words"),
        ("forfeit_received", 25, "Received forfeit from failed task"),
        ("stake_lock", -50, "Stake locked for task: Attend every class"),
    ]

    created = 0
    for i, (tx_type, amount, description) in enumerate(tx_templates):
        user_id = user_ids[i % len(user_ids)]
        try:
            sb.table("transactions").insert({
                "user_id": user_id,
                "amount": amount,
                "type": tx_type,
                "description": description,
            }).execute()
            created += 1
        except Exception as e:
            print(f"  Transaction insert failed: {e}")

    print(f"  Created {created} transactions")


def seed_squads(user_ids):
    squads_data = [
        {
            "name": "CS Study Group",
            "description": "Accountability for CS majors - exams, problem sets, projects",
            "invite_code": "cs-squad-001",
            "members": user_ids[:5],
            "pot_balance": 45,
        },
        {
            "name": "Fitness Grind",
            "description": "Daily workout accountability. No excuses.",
            "invite_code": "fit-grind-002",
            "members": user_ids[3:9],
            "pot_balance": 120,
        },
        {
            "name": "Morning Crew",
            "description": "Wake up before 7am every day. Early birds only.",
            "invite_code": "morning-crew-003",
            "members": user_ids[6:],
            "pot_balance": 30,
        },
    ]

    for squad_data in squads_data:
        members = squad_data.pop("members")
        creator = members[0]
        squad_data["creator_id"] = creator
        try:
            result = sb.table("squads").insert(squad_data).execute()
            squad_id = result.data[0]["id"]
            for i, uid in enumerate(members):
                role = "admin" if i == 0 else "member"
                sb.table("squad_members").insert({
                    "squad_id": squad_id,
                    "user_id": uid,
                    "role": role,
                }).execute()
            print(f"  Created squad: {squad_data['name']} ({len(members)} members)")
        except Exception as e:
            print(f"  Squad insert failed ({squad_data['name']}): {e}")


def seed_friendships(user_ids):
    pairs = [
        (0, 1, "accepted"),
        (0, 2, "accepted"),
        (1, 3, "accepted"),
        (2, 4, "accepted"),
        (3, 5, "accepted"),
        (4, 6, "accepted"),
        (5, 7, "accepted"),
        (0, 3, "pending"),
        (1, 4, "pending"),
        (6, 9, "pending"),
        (7, 10, "accepted"),
        (8, 11, "accepted"),
        (9, 10, "accepted"),
        (2, 7, "declined"),
    ]

    created = 0
    for a, b, status in pairs:
        if a >= len(user_ids) or b >= len(user_ids):
            continue
        try:
            sb.table("friendships").insert({
                "requester_id": user_ids[a],
                "addressee_id": user_ids[b],
                "status": status,
            }).execute()
            created += 1
        except Exception as e:
            print(f"  Friendship insert failed: {e}")

    print(f"  Created {created} friendships")


def seed():
    print("Seeding database...")

    print("\nCreating users...")
    user_ids = get_or_create_users()
    if len(user_ids) < 4:
        print("Need at least 4 users. Exiting.")
        return

    print("\nCreating tasks...")
    seed_tasks(user_ids)

    print("\nCreating transactions...")
    seed_transactions(user_ids)

    print("\nCreating squads...")
    seed_squads(user_ids)

    print("\nCreating friendships...")
    seed_friendships(user_ids)

    print("\nSeeding complete!")


if __name__ == "__main__":
    seed()
