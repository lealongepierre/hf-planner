import json
import logging
from dataclasses import dataclass

from pywebpush import WebPushException, webpush
from sqlmodel import Session, select

from app.core.config import settings
from app.models import Favorite, PushSubscription

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class PushPayload:
    title: str
    body: str | None = None
    url: str | None = None
    icon: str | None = None
    tag: str | None = None

    def to_json(self) -> str:
        data = {"title": self.title}
        if self.body is not None:
            data["body"] = self.body
        if self.url is not None:
            data["url"] = self.url
        if self.icon is not None:
            data["icon"] = self.icon
        if self.tag is not None:
            data["tag"] = self.tag
        return json.dumps(data)


def _vapid_credentials() -> tuple[str, dict[str, str]]:
    if not settings.VAPID_PRIVATE_KEY:
        raise RuntimeError("VAPID_PRIVATE_KEY is not configured")
    return settings.VAPID_PRIVATE_KEY, {"sub": settings.VAPID_SUBJECT}


def _send_one(session: Session, sub: PushSubscription, payload_json: str) -> bool:
    private_key, claims = _vapid_credentials()
    try:
        webpush(
            subscription_info={
                "endpoint": sub.endpoint,
                "keys": {"p256dh": sub.p256dh, "auth": sub.auth},
            },
            data=payload_json,
            vapid_private_key=private_key,
            vapid_claims=dict(claims),
        )
        return True
    except WebPushException as exc:
        status_code = getattr(exc.response, "status_code", None) if exc.response else None
        if status_code in (404, 410):
            logger.info("Removing dead push subscription %s (status=%s)", sub.endpoint, status_code)
            session.delete(sub)
            session.commit()
            return False
        logger.warning("Web push failed for %s: %s", sub.endpoint, exc)
        return False


def send_to_user(session: Session, user_id: int, payload: PushPayload) -> int:
    """Send `payload` to every active subscription belonging to `user_id`.

    Returns the number of successful pushes.
    """
    subs = session.exec(select(PushSubscription).where(PushSubscription.user_id == user_id)).all()
    payload_json = payload.to_json()
    return sum(1 for s in subs if _send_one(session, s, payload_json))


def send_to_concert_favorites(session: Session, concert_id: int, payload: PushPayload) -> int:
    """Send `payload` to every subscription owned by users who favorited `concert_id`."""
    subs = session.exec(
        select(PushSubscription)
        .join(Favorite, Favorite.user_id == PushSubscription.user_id)  # type: ignore[arg-type]
        .where(Favorite.concert_id == concert_id)
    ).all()
    payload_json = payload.to_json()
    return sum(1 for s in subs if _send_one(session, s, payload_json))


def send_to_all(session: Session, payload: PushPayload) -> int:
    subs = session.exec(select(PushSubscription)).all()
    payload_json = payload.to_json()
    return sum(1 for s in subs if _send_one(session, s, payload_json))
