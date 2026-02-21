"""
Session manager for GoingToCamp platforms.

Handles authentication and session warming for booking execution.
Sessions are kept warm via pre-staging before the booking window opens.
"""

import httpx
import logging
from dataclasses import dataclass, field
from typing import Optional

logger = logging.getLogger(__name__)

# GoingToCamp API base paths
AUTH_ENDPOINT = "/api/authenticate"
VALIDATE_ENDPOINT = "/api/authenticate/validate"


@dataclass
class SessionInfo:
    domain: str
    session_cookie: str
    auth_token: str
    headers: dict = field(default_factory=dict)


async def authenticate(
    domain: str,
    username: str,
    password: str,
) -> SessionInfo:
    """
    Authenticate with a GoingToCamp platform and return session info.

    GoingToCamp uses a POST to /api/authenticate with form credentials,
    returning a session cookie and/or bearer token.
    """
    url = f"https://{domain}{AUTH_ENDPOINT}"

    async with httpx.AsyncClient(follow_redirects=True, timeout=30.0) as client:
        response = await client.post(
            url,
            json={"username": username, "password": password},
            headers={
                "Content-Type": "application/json",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                "Origin": f"https://{domain}",
                "Referer": f"https://{domain}/",
            },
        )

        if response.status_code != 200:
            error_text = response.text[:500]
            logger.error(
                f"Authentication failed for {domain}: {response.status_code} - {error_text}"
            )
            raise AuthenticationError(
                f"Login failed (HTTP {response.status_code}). "
                "Please check your credentials."
            )

        # Extract session info from response
        cookies = dict(response.cookies)
        auth_data = response.json() if response.headers.get("content-type", "").startswith("application/json") else {}

        # GoingToCamp may return a token in the response body or set cookies
        auth_token = auth_data.get("token", auth_data.get("access_token", ""))
        session_cookie = "; ".join(f"{k}={v}" for k, v in cookies.items())

        if not auth_token and not session_cookie:
            raise AuthenticationError("No session or token returned from authentication")

        session = SessionInfo(
            domain=domain,
            session_cookie=session_cookie,
            auth_token=auth_token,
            headers={
                "Cookie": session_cookie,
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                "Origin": f"https://{domain}",
                "Referer": f"https://{domain}/",
            },
        )

        if auth_token:
            session.headers["Authorization"] = f"Bearer {auth_token}"

        logger.info(f"Authenticated successfully with {domain}")
        return session


async def validate_session(session: SessionInfo) -> bool:
    """Check if an existing session is still valid."""
    url = f"https://{session.domain}{VALIDATE_ENDPOINT}"

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url, headers=session.headers)
            return response.status_code == 200
    except Exception:
        return False


class AuthenticationError(Exception):
    """Raised when GoingToCamp authentication fails."""

    pass
