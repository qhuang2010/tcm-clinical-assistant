from fastapi import APIRouter, Depends
from src.services import auth_service
from src.services.sync_service import SyncService

router = APIRouter(
    prefix="/api/sync",
    tags=["sync"],
    dependencies=[Depends(auth_service.get_current_active_user)]
)

# Initialize Sync Service
sync_service = SyncService()

@router.get("/status")
async def get_sync_status():
    """
    Get current synchronization status.
    """
    pending_count = sync_service.get_pending_count()
    return {
        "status": "online", 
        "pending_count": pending_count,
        "message": f"{pending_count} records pending upload"
    }

@router.post("/trigger")
async def trigger_sync():
    """
    Trigger manual synchronization (Push & Pull).
    """
    # Run sync in background or await? For simplicity, await.
    # In production, use BackgroundTasks.
    result = sync_service.sync_all() # New push-pull
    return result
