"""
Users API — profile management.
"""
from fastapi import APIRouter, HTTPException, Request
from app.database import get_db
from app.schemas import UserCreate, UserUpdate, UserOut
from typing import Optional
import uuid

GUEST_USER_ID = "00000000-0000-0000-0000-000000000000"


def _get_current_user(request: Optional[Request] = None) -> dict:
    return {"id": GUEST_USER_ID, "email": "guest@bioinsight.local"}


router = APIRouter(prefix="/user", tags=["user"])


@router.get("/me", response_model=UserOut)
async def get_profile(request: Request):
    current_user = _get_current_user(request)
    db = get_db()
    result = db.table("users").select("*").eq("id", current_user["id"]).maybe_single().execute()
    if not result or not result.data:
        raise HTTPException(status_code=404, detail="Profile not found")
    return UserOut(**result.data)


@router.post("/me", response_model=UserOut, status_code=201)
async def create_profile(body: UserCreate, request: Request):
    current_user = _get_current_user(request)
    db = get_db()

    existing = db.table("users").select("id").eq("id", current_user["id"]).maybe_single().execute()
    if existing and existing.data:
        raise HTTPException(status_code=409, detail="Profile already exists. Use PATCH to update.")

    row = {
        "id": current_user["id"],
        "email": current_user["email"],
        "name": body.name,
        "age": body.age,
        "sex": body.sex,
    }
    result = db.table("users").insert(row).execute()
    return UserOut(**result.data[0])


@router.patch("/me", response_model=UserOut)
async def update_profile(body: UserUpdate, request: Request):
    current_user = _get_current_user(request)
    db = get_db()

    updates = body.model_dump(exclude_none=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")

    result = db.table("users").update(updates).eq("id", current_user["id"]).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Profile not found")
    return UserOut(**result.data[0])
