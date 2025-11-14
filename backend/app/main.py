from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import auth, concerts, favorites, users

app = FastAPI(
    title="Hellfest Planner API",
    description="API for planning your Hellfest concert attendance",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(concerts.router)
app.include_router(favorites.router)
app.include_router(users.router)


@app.get("/")
def root():
    return {"message": "Welcome to Hellfest Planner API", "version": "0.1.0"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}
