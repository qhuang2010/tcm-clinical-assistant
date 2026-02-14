import sys
import os

from fastapi import FastAPI
from fastapi.responses import HTMLResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# Ensure src is in python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.database.connection import engine, Base
# Import models to register tables with SQLAlchemy
import src.database.models

from web.routers import auth, admin, patients, records, practitioners, analysis, sync, system, files, prescription, permissions

# Create tables if they don't exist
# Note: In production, use Alembic for migrations
try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    print(f"Warning: Could not connect to database to create tables. Please ensure PostgreSQL is running. Error: {e}")

app = FastAPI(title="中医脉象九宫格OCR识别系统")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://localhost:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(patients.router)
app.include_router(records.router)
app.include_router(practitioners.router)
app.include_router(analysis.router)
app.include_router(sync.router)
app.include_router(files.router)
app.include_router(prescription.router)
app.include_router(permissions.router)
app.include_router(system.router)

# Mount static files from React build
# Note: Ensure 'npm run build' has been executed in web/frontend
frontend_dist = os.path.join(os.path.dirname(os.path.abspath(__file__)), "frontend", "dist")
if os.path.exists(frontend_dist):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist, "assets")), name="assets")

@app.get("/", response_class=HTMLResponse)
async def read_root():
    # Serve the React app
    index_path = os.path.join(frontend_dist, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return HTMLResponse(content="<h1>Frontend build not found. Please run 'npm run build' in web/frontend</h1>", status_code=404)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
