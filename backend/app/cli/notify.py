"""Admin CLI for broadcasting Web Push notifications.

Usage:
    poetry run notify concert <concert_id> --title "..." --body "..." [--url "/concerts"]
    poetry run notify all --title "..." --body "..." [--url "/concerts"]
"""

import typer
from sqlmodel import Session

from app.database.connection import engine
from app.services.push_broadcaster import (
    PushPayload,
    send_to_all,
    send_to_concert_favorites,
)

app = typer.Typer(help="Send Web Push notifications to Hellfest Planner users.")


@app.command()
def concert(
    concert_id: int = typer.Argument(..., help="Concert ID to notify favoriters of."),
    title: str = typer.Option(..., "--title", help="Notification title."),
    body: str = typer.Option("", "--body", help="Notification body."),
    url: str = typer.Option("/concerts", "--url", help="URL to open on tap."),
) -> None:
    """Notify every user who has favorited the given concert."""
    payload = PushPayload(title=title, body=body or None, url=url, tag=f"concert-{concert_id}")
    with Session(engine) as session:
        sent = send_to_concert_favorites(session, concert_id, payload)
    typer.echo(f"Sent {sent} notification(s) for concert {concert_id}.")


@app.command(name="all")
def all_users(
    title: str = typer.Option(..., "--title", help="Notification title."),
    body: str = typer.Option("", "--body", help="Notification body."),
    url: str = typer.Option("/concerts", "--url", help="URL to open on tap."),
) -> None:
    """Broadcast to every active push subscription."""
    payload = PushPayload(title=title, body=body or None, url=url, tag="lineup-broadcast")
    with Session(engine) as session:
        sent = send_to_all(session, payload)
    typer.echo(f"Sent {sent} notification(s) to all subscribers.")


if __name__ == "__main__":
    app()
