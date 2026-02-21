"""
Search endpoint — delegates to camply's provider search.
"""

from datetime import date
from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


class SearchRequest(BaseModel):
    provider: str  # "going_to_camp" | "recreation_gov"
    query: Optional[str] = None
    state: Optional[str] = None
    campground_id: Optional[str] = None
    # GoingToCamp-specific
    domain: Optional[str] = None  # e.g. "reservations.ontarioparks.ca"


class CampgroundResult(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    facility_id: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None


@router.post("")
async def search_campgrounds(req: SearchRequest):
    """Search for campgrounds via camply providers."""
    try:
        if req.provider == "going_to_camp":
            return await _search_going_to_camp(req)
        elif req.provider == "recreation_gov":
            return await _search_recreation_gov(req)
        else:
            raise HTTPException(400, f"Unsupported provider: {req.provider}")
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Search failed")
        raise HTTPException(500, f"Search failed: {str(e)}")


async def _search_going_to_camp(req: SearchRequest):
    """Search GoingToCamp campgrounds (Ontario Parks, Parks Canada, etc.)."""
    from camply.providers.going_to_camp.going_to_camp_provider import (
        GoingToCampProvider,
    )

    domain = req.domain or "reservations.ontarioparks.ca"

    provider = GoingToCampProvider()
    campgrounds = provider.list_campgrounds(domain=domain)

    results = []
    for cg in campgrounds:
        # Filter by query if provided
        if req.query and req.query.lower() not in str(cg).lower():
            continue

        results.append(
            {
                "id": str(getattr(cg, "facility_id", getattr(cg, "id", ""))),
                "name": getattr(cg, "facility_name", getattr(cg, "name", "Unknown")),
                "description": getattr(cg, "description", None),
                "latitude": getattr(cg, "latitude", None),
                "longitude": getattr(cg, "longitude", None),
            }
        )

    return {"results": results, "total": len(results), "provider": "going_to_camp"}


async def _search_recreation_gov(req: SearchRequest):
    """Search Recreation.gov campgrounds."""
    from camply.providers.recreation_dot_gov import RecreationDotGov

    provider = RecreationDotGov()

    if req.query:
        campgrounds = provider.search_for_campgrounds(search_string=req.query)
    elif req.state:
        campgrounds = provider.search_for_campgrounds(state=req.state)
    else:
        raise HTTPException(400, "query or state required for recreation_gov search")

    results = []
    for cg in campgrounds:
        results.append(
            {
                "id": str(getattr(cg, "facility_id", getattr(cg, "id", ""))),
                "name": getattr(cg, "facility_name", getattr(cg, "name", "Unknown")),
                "description": getattr(cg, "description", None),
                "latitude": getattr(cg, "latitude", None),
                "longitude": getattr(cg, "longitude", None),
            }
        )

    return {"results": results, "total": len(results), "provider": "recreation_gov"}
