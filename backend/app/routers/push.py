from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlmodel import Session, select

from app.core.config import settings
from app.core.dependencies import get_current_user
from app.database.connection import get_session
from app.models import PushSubscription, User
from app.schemas.push import (
    PushSubscribeRequest,
    PushSubscriptionResponse,
    PushUnsubscribeRequest,
    VapidPublicKeyResponse,
)

router = APIRouter(prefix="/api/v1/push", tags=["Push"])


@router.get("/vapid-public-key", response_model=VapidPublicKeyResponse)
def get_vapid_public_key():
    if not settings.VAPID_PUBLIC_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Push notifications are not configured on this server",
        )
    return VapidPublicKeyResponse(key=settings.VAPID_PUBLIC_KEY)


@router.post(
    "/subscriptions",
    response_model=PushSubscriptionResponse,
    status_code=status.HTTP_201_CREATED,
)
def subscribe(
    payload: PushSubscribeRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    existing = session.exec(
        select(PushSubscription).where(PushSubscription.endpoint == payload.endpoint)
    ).first()

    user_agent = payload.user_agent or request.headers.get("user-agent")

    if existing:
        existing.user_id = current_user.id  # type: ignore[assignment]
        existing.p256dh = payload.keys.p256dh
        existing.auth = payload.keys.auth
        existing.user_agent = user_agent
        session.add(existing)
        session.commit()
        session.refresh(existing)
        return PushSubscriptionResponse(id=existing.id, endpoint=existing.endpoint)  # type: ignore[arg-type]

    sub = PushSubscription(
        user_id=current_user.id,  # type: ignore[arg-type]
        endpoint=payload.endpoint,
        p256dh=payload.keys.p256dh,
        auth=payload.keys.auth,
        user_agent=user_agent,
    )
    session.add(sub)
    session.commit()
    session.refresh(sub)
    return PushSubscriptionResponse(id=sub.id, endpoint=sub.endpoint)  # type: ignore[arg-type]


@router.delete("/subscriptions", status_code=status.HTTP_204_NO_CONTENT)
def unsubscribe(
    payload: PushUnsubscribeRequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    sub = session.exec(
        select(PushSubscription).where(
            PushSubscription.endpoint == payload.endpoint,
            PushSubscription.user_id == current_user.id,
        )
    ).first()
    if sub:
        session.delete(sub)
        session.commit()
    return None
