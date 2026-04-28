from pydantic import BaseModel, Field
from datetime import datetime
from enum import Enum


class TaskStatus(str, Enum):
    pending_acceptance = "pending_acceptance"
    active = "active"
    proof_submitted = "proof_submitted"
    completed = "completed"
    failed = "failed"
    expired = "expired"
    declined = "declined"


class TaskCategory(str, Enum):
    study = "study"
    fitness = "fitness"
    wellness = "wellness"
    productivity = "productivity"
    social = "social"
    custom = "custom"


class TaskCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str | None = None
    category: TaskCategory = TaskCategory.custom
    stake_amount: int = Field(ge=1, le=50)
    verifier_id: str
    deadline: datetime
    proof_type: str = "photo"  # photo | text | both


class TaskResponse(BaseModel):
    id: str
    title: str
    description: str | None = None
    category: TaskCategory
    stake_amount: int
    creator_id: str
    verifier_id: str
    creator_name: str | None = None
    verifier_name: str | None = None
    status: TaskStatus
    deadline: datetime
    proof_type: str
    proof_url: str | None = None
    proof_text: str | None = None
    submitted_at: datetime | None = None
    verified_at: datetime | None = None
    created_at: datetime


class ProofSubmit(BaseModel):
    proof_text: str | None = None
    proof_url: str | None = None


class VerifyRequest(BaseModel):
    approved: bool
    feedback: str | None = None
