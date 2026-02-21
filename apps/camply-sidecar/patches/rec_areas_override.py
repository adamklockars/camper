"""
Register Ontario Parks as a GoingToCamp recreation area in camply.

Ontario Parks runs on the same GoingToCamp platform as Parks Canada, BC Parks, etc.
The API is at reservations.ontarioparks.ca with standard GoingToCamp endpoints.
"""

import logging

logger = logging.getLogger(__name__)

# Ontario Parks GoingToCamp configuration.
# The recreation_area_id may need to be confirmed via the API:
# GET https://reservations.ontarioparks.ca/api/resourcecategory/listcategories
ONTARIO_PARKS_CONFIG = {
    "domain": "reservations.ontarioparks.ca",
    "recreation_area": "Ontario Parks",
    "recreation_area_id": -2147483550,  # Discovery needed — placeholder from GoingToCamp pattern
    "recreation_area_location": "Ontario, CA",
}


def register_ontario_parks():
    """
    Attempt to register Ontario Parks in camply's GoingToCamp provider.
    Falls back gracefully if camply internals have changed.
    """
    try:
        from camply.providers.going_to_camp.going_to_camp_provider import (
            GoingToCampProvider,
        )

        # camply stores GoingToCamp recreation areas in a dict keyed by domain.
        # We inject Ontario Parks into that registry.
        if hasattr(GoingToCampProvider, "_recreation_areas"):
            areas = GoingToCampProvider._recreation_areas
        elif hasattr(GoingToCampProvider, "recreation_areas"):
            areas = GoingToCampProvider.recreation_areas
        else:
            # Try the module-level rec_areas dict
            from camply.providers.going_to_camp import rec_areas

            if hasattr(rec_areas, "RECREATION_AREAS"):
                areas = rec_areas.RECREATION_AREAS
            else:
                logger.warning(
                    "Could not find GoingToCamp recreation areas registry. "
                    "Ontario Parks registration skipped."
                )
                return

        domain = ONTARIO_PARKS_CONFIG["domain"]
        if domain not in areas:
            areas[domain] = {
                "recreation_area": ONTARIO_PARKS_CONFIG["recreation_area"],
                "recreation_area_id": ONTARIO_PARKS_CONFIG["recreation_area_id"],
                "recreation_area_location": ONTARIO_PARKS_CONFIG[
                    "recreation_area_location"
                ],
            }
            logger.info(f"Registered Ontario Parks at {domain}")
        else:
            logger.info(f"Ontario Parks already registered at {domain}")

    except ImportError:
        logger.warning(
            "camply GoingToCamp provider not available. "
            "Ontario Parks registration skipped."
        )
    except Exception as e:
        logger.warning(f"Failed to register Ontario Parks: {e}")
