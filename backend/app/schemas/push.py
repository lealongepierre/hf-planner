from pydantic import BaseModel, Field


class PushKeys(BaseModel):
    p256dh: str
    auth: str


class PushSubscribeRequest(BaseModel):
    endpoint: str = Field(min_length=1)
    keys: PushKeys
    user_agent: str | None = None


class PushUnsubscribeRequest(BaseModel):
    endpoint: str = Field(min_length=1)


class PushSubscriptionResponse(BaseModel):
    id: int
    endpoint: str


class VapidPublicKeyResponse(BaseModel):
    key: str
