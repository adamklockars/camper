"""
Availability endpoint — check site availability via camply providers.
"""

from datetime import date
from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


class AvailabilityRequest(BaseModel):
    provider: str  # "going_to_camp" | "recreation_gov"
    campground_id: str
    start_date: date
    end_date: date
    # GoingToCamp-specific
    domain: Optional[str] = None  # e.g. "reservations.ontarioparks.ca"


class SiteAvailability(BaseModel):
    site_id: str
    site_name: str
    available: bool
    available_dates: list[str]


@router.post("")
async def check_availability(req: AvailabilityRequest):
    """Check campsite availability via camply."""
    try:
        if req.provider == "going_to_camp":
            return await _check_going_to_camp(req)
        elif req.provider == "recreation_gov":
            return await _check_recreation_gov(req)
        else:
            raise HTTPException(400, f"Unsupported provider: {req.provider}")
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Availability check failed")
        raise HTTPException(500, f"Availability check failed: {str(e)}")


async def _check_going_to_camp(req: AvailabilityRequest):
    """Check availability on GoingToCamp platforms."""
    from camply.providers.going_to_camp.going_to_camp_provider import (
        GoingToCampProvider,
    )

    domain = req.domain or "reservations.ontarioparks.ca"

    provider = GoingToCampProvider()
    campsites = provider.get_campsites(
        campground_id=int(req.campground_id),
        start_date=req.start_date,
        end_date=req.end_date,
        domain=domain,
    )

    results = []
    for site in campsites:
        available_dates = [
            d.strftime("%Y-%m-%d")
            for d in getattr(site, "available_dates", [])
        ]
        results.append(
            {
                "site_id": str(getattr(site, "campsite_id", getattr(site, "id", ""))),
                "site_name": getattr(
                    site, "campsite_name", getattr(site, "name", "Unknown")
                ),
                "available": len(available_dates) > 0,
                "available_dates": available_dates,
            }
        )

    return {
        "results": results,
        "total": len(results),
        "campground_id": req.campground_id,
    }


async def _check_recreation_gov(req: AvailabilityRequest):
    """Check availability on Recreation.gov."""
    from camply.providers.recreation_dot_gov import RecreationDotGov

    provider = RecreationDotGov()
    campsites = provider.get_campsites(
        campground_id=int(req.campground_id),
        start_date=req.start_date,
        end_date=req.end_date,
    )

    results = []
    for site in campsites:
        available_dates = [
            d.strftime("%Y-%m-%d")
            for d in getattr(site, "available_dates", [])
        ]
        results.append(
            {
                "site_id": str(getattr(site, "campsite_id", getattr(site, "id", ""))),
                "site_name": getattr(
                    site, "campsite_name", getattr(site, "name", "Unknown")
                ),
                "available": len(available_dates) > 0,
                "available_dates": available_dates,
            }
        )

    return {
        "results": results,
        "total": len(results),
        "campground_id": req.campground_id,
    }
