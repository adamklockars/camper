"""
Booking endpoints — authenticate and book on GoingToCamp platforms.
"""

from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import logging

from services.session_manager import authenticate, AuthenticationError
from services.booking_executor import execute_booking

logger = logging.getLogger(__name__)
router = APIRouter()

# Domain mapping for platform names
PLATFORM_DOMAINS = {
    "ontario_parks": "reservations.ontarioparks.ca",
    "parks_canada": "reservation.pc.gc.ca",
    "bc_parks": "camping.bcparks.ca",
}


class LoginRequest(BaseModel):
    platform: str
    username: str
    password: str
    domain: Optional[str] = None


class LoginResponse(BaseModel):
    success: bool
    session_token: Optional[str] = None
    error: Optional[str] = None


class BookRequest(BaseModel):
    platform: str
    username: str
    password: str
    campground_id: str
    site_preferences: list[str]
    arrival_date: str  # YYYY-MM-DD
    departure_date: str  # YYYY-MM-DD
    equipment_type: str
    occupants: int
    domain: Optional[str] = None
    # Pre-authenticated session (from pre-staging)
    session_token: Optional[str] = None


class BookResponse(BaseModel):
    success: bool
    booking_id: Optional[str] = None
    site_id: Optional[str] = None
    confirmation_number: Optional[str] = None
    error: Optional[str] = None


@router.post("/login", response_model=LoginResponse)
async def login(req: LoginRequest):
    """
    Authenticate with a GoingToCamp platform.
    Used for credential validation and session pre-staging.
    """
    domain = req.domain or PLATFORM_DOMAINS.get(req.platform)
    if not domain:
        raise HTTPException(400, f"Unknown platform: {req.platform}")

    try:
        session = await authenticate(domain, req.username, req.password)
        return LoginResponse(
            success=True,
            session_token=session.auth_token or session.session_cookie,
        )
    except AuthenticationError as e:
        return LoginResponse(success=False, error=str(e))
    except Exception as e:
        logger.exception("Login failed")
        return LoginResponse(success=False, error=f"Login failed: {str(e)}")


@router.post("", response_model=BookResponse)
async def book(req: BookRequest):
    """
    Execute a campsite booking on a GoingToCamp platform.

    This is the core sniper endpoint:
    1. Authenticate (or use pre-warmed session)
    2. Check availability for preferred sites in order
    3. Book the first available site
    """
    domain = req.domain or PLATFORM_DOMAINS.get(req.platform)
    if not domain:
        raise HTTPException(400, f"Unknown platform: {req.platform}")

    try:
        # Authenticate
        session = await authenticate(domain, req.username, req.password)

        # Execute booking
        result = await execute_booking(
            session=session,
            campground_id=req.campground_id,
            site_preferences=req.site_preferences,
            arrival_date=req.arrival_date,
            departure_date=req.departure_date,
            equipment_type=req.equipment_type,
            occupants=req.occupants,
        )

        return BookResponse(
            success=result.success,
            booking_id=result.booking_id,
            site_id=result.site_id,
            confirmation_number=result.confirmation_number,
            error=result.error,
        )

    except AuthenticationError as e:
        return BookResponse(success=False, error=str(e))
    except Exception as e:
        logger.exception("Booking failed")
        return BookResponse(success=False, error=f"Booking failed: {str(e)}")
