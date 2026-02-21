"""
Booking executor for GoingToCamp platforms.

This is the core differentiator — automated booking execution.
Uses GoingToCamp's standard reservation API:
  1. POST /api/reservation/create  — Create a reservation hold
  2. POST /api/reservation/confirm — Confirm and complete the booking

The exact endpoints and payload structure follow GoingToCamp's standard pattern
across all platforms (Ontario Parks, Parks Canada, BC Parks, etc.)
"""

import httpx
import logging
from dataclasses import dataclass
from typing import Optional
from .session_manager import SessionInfo

logger = logging.getLogger(__name__)


# GoingToCamp reservation API endpoints
AVAILABILITY_ENDPOINT = "/api/availability/map"
RESERVATION_CREATE_ENDPOINT = "/api/reservation/create"
RESERVATION_CONFIRM_ENDPOINT = "/api/reservation/confirm"
CART_ADD_ENDPOINT = "/api/cart/add"
CART_CHECKOUT_ENDPOINT = "/api/cart/checkout"


@dataclass
class BookingResult:
    success: bool
    booking_id: Optional[str] = None
    site_id: Optional[str] = None
    site_name: Optional[str] = None
    confirmation_number: Optional[str] = None
    error: Optional[str] = None


async def execute_booking(
    session: SessionInfo,
    campground_id: str,
    site_preferences: list[str],
    arrival_date: str,
    departure_date: str,
    equipment_type: str,
    occupants: int,
) -> BookingResult:
    """
    Execute a booking on a GoingToCamp platform.

    Iterates through site_preferences in order, checking availability
    and attempting to book the first available site.
    """
    domain = session.domain

    async with httpx.AsyncClient(
        follow_redirects=True,
        timeout=30.0,
    ) as client:
        # Try each preferred site in order
        for site_id in site_preferences:
            logger.info(f"Attempting to book site {site_id} at {domain}")

            try:
                # Step 1: Check if site is available right now
                available = await _check_site_available(
                    client, session, campground_id, site_id, arrival_date, departure_date
                )

                if not available:
                    logger.info(f"Site {site_id} not available, trying next")
                    continue

                # Step 2: Create reservation / add to cart
                cart_result = await _add_to_cart(
                    client,
                    session,
                    campground_id,
                    site_id,
                    arrival_date,
                    departure_date,
                    equipment_type,
                    occupants,
                )

                if not cart_result:
                    logger.warning(f"Failed to add site {site_id} to cart, trying next")
                    continue

                # Step 3: Checkout / confirm reservation
                confirmation = await _checkout(client, session)

                if confirmation:
                    logger.info(
                        f"Booking confirmed! Site {site_id}, "
                        f"confirmation: {confirmation}"
                    )
                    return BookingResult(
                        success=True,
                        booking_id=confirmation.get("booking_id"),
                        site_id=site_id,
                        confirmation_number=confirmation.get("confirmation_number"),
                    )
                else:
                    logger.warning(f"Checkout failed for site {site_id}")
                    continue

            except Exception as e:
                logger.exception(f"Error booking site {site_id}")
                continue

        # All preferred sites exhausted
        return BookingResult(
            success=False,
            error="No preferred sites were available at the time of booking",
        )


async def _check_site_available(
    client: httpx.AsyncClient,
    session: SessionInfo,
    campground_id: str,
    site_id: str,
    arrival_date: str,
    departure_date: str,
) -> bool:
    """Check if a specific site is available for the given dates."""
    url = f"https://{session.domain}{AVAILABILITY_ENDPOINT}"

    try:
        response = await client.post(
            url,
            json={
                "mapId": int(campground_id),
                "resourceLocationId": int(site_id),
                "startDate": arrival_date,
                "endDate": departure_date,
            },
            headers=session.headers,
        )

        if response.status_code != 200:
            return False

        data = response.json()
        # GoingToCamp returns availability data — check if site shows as available
        return _parse_availability(data, site_id)

    except Exception as e:
        logger.warning(f"Availability check failed for site {site_id}: {e}")
        return False


def _parse_availability(data: dict, site_id: str) -> bool:
    """Parse GoingToCamp availability response to determine if site is bookable."""
    # GoingToCamp availability responses vary by endpoint version.
    # Common patterns: resourceAvailabilities array, or map-based response.
    if isinstance(data, list):
        for item in data:
            if str(item.get("resourceLocationId", "")) == str(site_id):
                return item.get("available", False)
    elif isinstance(data, dict):
        availabilities = data.get("resourceAvailabilities", [])
        for item in availabilities:
            if str(item.get("resourceLocationId", "")) == str(site_id):
                return item.get("available", False)
        # If no specific site match found, check the overall response
        return data.get("available", False)

    return False


async def _add_to_cart(
    client: httpx.AsyncClient,
    session: SessionInfo,
    campground_id: str,
    site_id: str,
    arrival_date: str,
    departure_date: str,
    equipment_type: str,
    occupants: int,
) -> Optional[dict]:
    """Add a campsite reservation to the cart."""
    url = f"https://{session.domain}{CART_ADD_ENDPOINT}"

    try:
        response = await client.post(
            url,
            json={
                "mapId": int(campground_id),
                "resourceLocationId": int(site_id),
                "startDate": arrival_date,
                "endDate": departure_date,
                "equipmentType": equipment_type,
                "partySize": occupants,
                "isReserving": True,
            },
            headers=session.headers,
        )

        if response.status_code in (200, 201):
            return response.json()

        logger.warning(
            f"Add to cart failed: {response.status_code} - {response.text[:300]}"
        )
        return None

    except Exception as e:
        logger.warning(f"Add to cart error: {e}")
        return None


async def _checkout(
    client: httpx.AsyncClient,
    session: SessionInfo,
) -> Optional[dict]:
    """Complete the checkout and confirm the reservation."""
    url = f"https://{session.domain}{CART_CHECKOUT_ENDPOINT}"

    try:
        response = await client.post(
            url,
            json={},
            headers=session.headers,
        )

        if response.status_code in (200, 201):
            data = response.json()
            return {
                "booking_id": data.get("reservationId", data.get("bookingId")),
                "confirmation_number": data.get(
                    "confirmationNumber", data.get("confirmation")
                ),
            }

        logger.warning(
            f"Checkout failed: {response.status_code} - {response.text[:300]}"
        )
        return None

    except Exception as e:
        logger.warning(f"Checkout error: {e}")
        return None
