from pydantic import BaseModel
from datetime import datetime

from app.models.user import UserSummary


class FriendRequest(BaseModel):
    user_id: str


class FriendResponse(BaseModel):
    id: str
    requester_id: str
    addressee_id: str
    status: str
    created_at: datetime
    profile: UserSummary


class FriendAction(BaseModel):
    action: str  # "accept" or "decline"
