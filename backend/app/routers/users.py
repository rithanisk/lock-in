from fastapi import APIRouter, Depends, Query

from app.dependencies import get_current_user
from app.models.user import UserSummary
from app.supabase_client import get_supabase

router = APIRouter()


@router.get("/search", response_model=list[UserSummary])
async def search_users(
    q: str = Query(min_length=2),
    user: dict = Depends(get_current_user),
):
    sb = get_supabase()
    result = sb.table("profiles").select("*").ilike("display_name", f"%{q}%").neq("id", user["id"]).limit(10).execute()
    return result.data


@router.get("/me", response_model=UserSummary)
async def get_me(user: dict = Depends(get_current_user)):
    sb = get_supabase()
    result = sb.table("profiles").select("*").eq("id", user["id"]).single().execute()
    return result.data
