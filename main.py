"""FastAPI entrypoint for Folio: Collaborative Digital Library & Book Publishing Platform."""
from fastapi import FastAPI
from platform_app import create_app
from library_api import router as library_router

def register_folio_routes(app: FastAPI) -> None:
    app.include_router(library_router)

app = create_app(register_folio_routes)
