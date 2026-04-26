from pydantic import BaseModel, Field
from datetime import datetime
from enum import Enum


class SquadCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    description: str | None = None
    invite_code: str | None = None
    max_members: int = Field(default=10, ge=2, le=20)


class SquadResponse(BaseModel):
    id: str
    name: str
    description: str | None = None
    invite_code: str
    pot_balance: int = 0
    max_members: int
    creator_id: str
    created_at: datetime
    member_count: int = 0


class JoinSquad(BaseModel):
    invite_code: str


class SpendProposal(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str | None = None
    amount: int = Field(ge=1)


class SpendProposalResponse(BaseModel):
    id: str
    squad_id: str
    title: str
    description: str | None = None
    amount: int
    proposer_id: str
    votes_for: int = 0
    votes_against: int = 0
    status: str = "open"
    created_at: datetime


class VoteRequest(BaseModel):
    proposal_id: str
    vote: bool  # True = for, False = against
