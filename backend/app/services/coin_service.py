from app.supabase_client import get_supabase


def get_balance(user_id: str) -> int:
    """Get user's current LockCoin balance."""
    sb = get_supabase()
    result = sb.table("profiles").select("balance").eq("id", user_id).single().execute()
    return result.data["balance"]


def lock_stake(user_id: str, amount: int) -> bool:
    """Deduct stake from user balance. Returns False if insufficient funds."""
    sb = get_supabase()
    balance = get_balance(user_id)
    if balance < amount:
        return False
    sb.table("profiles").update({"balance": balance - amount}).eq("id", user_id).execute()
    sb.table("transactions").insert({
        "user_id": user_id,
        "amount": -amount,
        "type": "stake_lock",
        "description": "Stake locked for task",
    }).execute()
    return True


def return_stake(user_id: str, amount: int) -> None:
    """Return stake to user (task completed successfully)."""
    sb = get_supabase()
    balance = get_balance(user_id)
    sb.table("profiles").update({"balance": balance + amount}).eq("id", user_id).execute()
    sb.table("transactions").insert({
        "user_id": user_id,
        "amount": amount,
        "type": "stake_return",
        "description": "Stake returned - task completed",
    }).execute()


def forfeit_to_verifier(creator_id: str, verifier_id: str, amount: int) -> None:
    """Transfer forfeited stake to verifier."""
    sb = get_supabase()
    verifier_balance = get_balance(verifier_id)
    sb.table("profiles").update({"balance": verifier_balance + amount}).eq("id", verifier_id).execute()
    sb.table("transactions").insert({
        "user_id": creator_id,
        "amount": -amount,
        "type": "stake_forfeit",
        "description": "Stake forfeited - task failed",
    }).execute()
    sb.table("transactions").insert({
        "user_id": verifier_id,
        "amount": amount,
        "type": "forfeit_received",
        "description": "Received forfeited stake as verifier",
    }).execute()


def forfeit_to_pot(creator_id: str, squad_id: str, amount: int) -> None:
    """Transfer forfeited stake to squad pot."""
    sb = get_supabase()
    squad = sb.table("squads").select("pot_balance").eq("id", squad_id).single().execute()
    sb.table("squads").update({"pot_balance": squad.data["pot_balance"] + amount}).eq("id", squad_id).execute()
    sb.table("transactions").insert({
        "user_id": creator_id,
        "amount": -amount,
        "type": "stake_forfeit_pot",
        "description": f"Stake forfeited to squad pot",
    }).execute()
