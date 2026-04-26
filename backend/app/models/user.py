from pydantic import BaseModel
from datetime import datetime


class UserSummary(BaseModel):
    id: str
    display_name: str
    avatar_url: str | None = None
    university: str | None = None
    balance: int = 100
    current_streak: int = 0
    longest_streak: int = 0
    created_at: datetime | None = None
