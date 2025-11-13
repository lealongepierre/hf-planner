import hashlib
from datetime import datetime, timedelta

import bcrypt
from jose import JWTError, jwt  # type: ignore[import-untyped]

from app.core.config import settings


def _preprocess_password(password: str) -> bytes:
    """Hash password with SHA256 first to handle bcrypt's 72-byte limit."""
    return hashlib.sha256(password.encode()).digest()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(_preprocess_password(plain_password), hashed_password.encode())


def get_password_hash(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(_preprocess_password(password), salt)
    return hashed.decode()


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> dict | None:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except JWTError:
        return None
