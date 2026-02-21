"""
Camply Sidecar — FastAPI wrapper over camply for campsite search, availability,
and booking execution on GoingToCamp platforms (Ontario Parks, Parks Canada, BC Parks, etc.)
"""

from fastapi import FastAPI
from routes.search import router as search_router
from routes.availability import router as availability_router
from routes.booking import router as booking_router
from patches.rec_areas_override import register_ontario_parks

# Register Ontario Parks as a GoingToCamp recreation area on startup
register_ontario_parks()

app = FastAPI(
    title="Camply Sidecar",
    description="Campsite search, availability, and booking via camply",
    version="1.0.0",
)

app.include_router(search_router, prefix="/search", tags=["Search"])
app.include_router(availability_router, prefix="/availability", tags=["Availability"])
app.include_router(booking_router, prefix="/book", tags=["Booking"])


@app.get("/health")
async def health():
    return {"status": "ok", "service": "camply-sidecar"}


@app.get("/providers")
async def providers():
    return {
        "providers": [
            {
                "id": "going_to_camp",
                "name": "GoingToCamp",
                "platforms": [
                    "Ontario Parks",
                    "Parks Canada",
                    "BC Parks",
                ],
                "supports_booking": True,
            },
            {
                "id": "recreation_gov",
                "name": "Recreation.gov",
                "supports_booking": False,
            },
        ]
    }
