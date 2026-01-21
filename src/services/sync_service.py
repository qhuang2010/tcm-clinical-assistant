from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import datetime
from src.database.connection import SessionLocal, SessionCloud
from src.database.models import User, Patient, Practitioner, MedicalRecord
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SyncService:
    """
    Handles synchronization between Local (SQLite) and Cloud (PostgreSQL) databases.
    Strategy: 
    - Offline First: Local DB is the source of truth for UI.
    - Sync Up: Pushes local changes to Cloud.
    - Sync Down: Pulls new/updated records from Cloud (optional, depending on requirement).
    """

    MODELS_ORDER = [User, Practitioner, Patient, MedicalRecord]

    def __init__(self):
        pass

    def get_local_db(self):
        return SessionLocal()

    def get_cloud_db(self):
        if not SessionCloud:
            raise ConnectionError("Cloud database is not configured.")
        return SessionCloud()

    def sync_all(self):
        """Unified sync method: Push then Pull."""
        # 1. Sync Up
        up_results = self.sync_up()
        if up_results['status'] == 'error':
            return up_results
        
        # 2. Sync Down
        down_results = self.sync_down()
        if down_results['status'] == 'error':
            # Partial success on up
            down_results['data']['synced_up'] = up_results['data']['synced']
            return down_results

        # Merge results for UI
        return {
            "status": "completed",
            "data": {
                "synced": up_results['data']['synced'],
                "failed": up_results['data']['failed'] + down_results['data']['failed'],
                "downloaded": down_results['data']['synced'],
                "details": up_results['data']['details'] + down_results['data']['details']
            }
        }

    def sync_up(self):
        """
        Push pending changes from Local to Cloud.
        """
        local_db = self.get_local_db()
        cloud_db = None
        results = {"synced": 0, "failed": 0, "details": []}

        try:
            cloud_db = self.get_cloud_db()
            
            # 1. Iterate through models in dependency order
            for model in self.MODELS_ORDER:
                # Find pending records
                pending_records = local_db.query(model).filter(
                    (model.sync_status == 'pending') | (model.sync_status == 'failed')
                ).all()

                for record in pending_records:
                    try:
                        self._sync_record_up(local_db, cloud_db, model, record)
                        results["synced"] += 1
                    except Exception as e:
                        logger.error(f"Failed to sync {model.__tablename__} {record.uuid}: {e}")
                        if cloud_db:
                            cloud_db.rollback()
                        record.sync_status = 'failed'
                        local_db.commit()
                        results["failed"] += 1
                        results["details"].append(f"UP:{model.__tablename__}:{record.id} - {str(e)}")

        except ConnectionError as e:
            logger.error(f"Sync aborted: {e}")
            return {"status": "error", "message": "Cloud connection unavailable"}
        except Exception as e:
            logger.error(f"Sync error: {e}")
            return {"status": "error", "message": str(e)}
        finally:
            local_db.close()
            if cloud_db:
                cloud_db.close()

        return {"status": "completed", "data": results}

    def sync_down(self):
        """
        Pull new records from Cloud to Local.
        Simplistic approach: Query all active records from Cloud and Upsert locally.
        For larger datasets, efficient delta sync (based on last_synced_at) is needed.
        """
        local_db = self.get_local_db()
        cloud_db = None
        results = {"synced": 0, "failed": 0, "details": []}

        try:
            cloud_db = self.get_cloud_db()
            
            # Iterate: User -> Practitioner -> Patient -> MedicalRecord
            for model in self.MODELS_ORDER:
                # Get all records from Cloud (ignoring deleted for now)
                # Optimization needed for production!
                cloud_records = cloud_db.query(model).filter(model.is_deleted == False).all()
                
                for cloud_record in cloud_records:
                    try:
                        self._sync_record_down(local_db, cloud_db, model, cloud_record)
                        results["synced"] += 1
                    except Exception as e:
                        logger.error(f"Failed to pull {model.__tablename__} {cloud_record.uuid}: {e}")
                        if local_db:
                            local_db.rollback()
                        results["failed"] += 1
                        results["details"].append(f"DOWN:{model.__tablename__} - {str(e)}")
                        
        except Exception as e:
            logger.error(f"Sync Down error: {e}")
            return {"status": "error", "message": str(e)}
        finally:
            local_db.close()
            if cloud_db:
                cloud_db.close()
        
        return {"status": "completed", "data": results}

    def _sync_record_down(self, local_db: Session, cloud_db: Session, model, cloud_record):
        """
        Sync a single record from Cloud to Local.
        Handles cases where local record exists with different UUID but same unique field.
        """
        local_record = local_db.query(model).filter(model.uuid == cloud_record.uuid).first()
        
        if not local_record:
            # Try to find by unique fields before creating new record
            local_record = self._find_local_by_unique_fields(local_db, model, cloud_record)
            
            if local_record:
                # Found by unique field - update UUID to match cloud
                logger.info(f"Found existing {model.__tablename__} by unique field, updating UUID")
                local_record.uuid = cloud_record.uuid
            else:
                # Truly new record
                local_record = model()
                local_db.add(local_record)
        
        # Check timestamps to decide whether to update
        # If local is pending, DO NOT Overwrite! (Conflict)
        # Strategy: Cloud Wins if local is NOT pending.
        if local_record.sync_status == 'pending':
            # Conflict! Skip for now or handle smart merge.
            # Assuming 'Offline First' means user entered data is sacred in conflict.
            return 

        # Update attributes
        for column in model.__table__.columns:
            if column.name in ['id', 'metadata', 'sync_status']: 
                continue
            
            # Map Foreign Keys for Down Sync
            if column.name.endswith('_id') and getattr(cloud_record, column.name) is not None:
                 self._resolve_foreign_key_down(local_db, cloud_db, model, local_record, cloud_record, column.name)
            else:
                 setattr(local_record, column.name, getattr(cloud_record, column.name))
        
        local_record.sync_status = 'synced'
        local_record.last_synced_at = datetime.now()
        local_db.commit()

    def _find_local_by_unique_fields(self, local_db: Session, model, cloud_record):
        """
        Find a local record by unique field(s) instead of UUID.
        Used when UUID doesn't match but record may already exist locally.
        """
        if model == User:
            return local_db.query(model).filter(model.username == cloud_record.username).first()
        elif model == Practitioner:
            return local_db.query(model).filter(model.name == cloud_record.name).first()
        elif model == Patient:
            # Patient uniqueness: combination of name + phone (if phone exists)
            if cloud_record.phone:
                return local_db.query(model).filter(
                    model.name == cloud_record.name,
                    model.phone == cloud_record.phone
                ).first()
            else:
                return local_db.query(model).filter(model.name == cloud_record.name).first()
        elif model == MedicalRecord:
            # Medical records: match by patient + visit_date + created_at
            return local_db.query(model).filter(
                model.patient_id == cloud_record.patient_id,
                model.visit_date == cloud_record.visit_date,
                model.created_at == cloud_record.created_at
            ).first()
        return None

    def _resolve_foreign_key_down(self, local_db, cloud_db, model, local_record, cloud_record, fk_column):
        """
        Map a Cloud FK ID to a Local FK ID using UUID matching.
        """
        cloud_fk_id = getattr(cloud_record, fk_column)
        
        related_model = None
        if fk_column == 'user_id': related_model = User
        elif fk_column == 'patient_id': related_model = Patient
        elif fk_column == 'practitioner_id': related_model = Practitioner
        
        if not related_model: return

        # Cloud Related -> UUID
        cloud_related = cloud_db.query(related_model).filter(related_model.id == cloud_fk_id).first()
        if not cloud_related: return
        
        # UUID -> Local Related
        local_related = local_db.query(related_model).filter(related_model.uuid == cloud_related.uuid).first()
        
        if local_related:
            setattr(local_record, fk_column, local_related.id)
        else:
            # Dependency missing locally?! 
            # In simple loop, dependencies should come first. This implies strict order issues.
            pass

    def _sync_record_up(self, local_db: Session, cloud_db: Session, model, record):
        """
        Sync a single record from Local to Cloud.
        Uses UUID to find existing record in Cloud.
        """
        # 1. Check if record exists in Cloud by UUID
        cloud_record = cloud_db.query(model).filter(model.uuid == record.uuid).first()

        if not cloud_record:
            # Create new in Cloud
            # We must be careful to copy data but NOT the primary key 'id', 
            # let Cloud DB handle its own auto-increment ID to avoid conflicts.
            # However, for Foreign Keys, we need to map Local IDs to Cloud UUIDs? 
            # NO, easier approach: Re-query relationships by UUID if possible, or assume mirrored data.
            # For simplicity in this iteration: Copy attributes.
            
            cloud_record = model()
            cloud_db.add(cloud_record)
        
        # 2. Update attributes
        # Exclude internal SA state and ID
        for column in model.__table__.columns:
            if column.name in ['id', 'metadata']: # Skip PK and SA metadata
                continue
            
            # Special handling for Foreign Keys if IDs differ?
            # Ideally, we should store UUIDs for FKs too, but our schema uses Int IDs.
            # Strategy: We assume dependencies (User, Practitioner) are synced FIRST.
            # We need to resolve the Cloud ID for the foreign key.
            if column.name.endswith('_id') and getattr(record, column.name) is not None:
                self._resolve_foreign_key(local_db, cloud_db, model, record, cloud_record, column.name)
            else:
                setattr(cloud_record, column.name, getattr(record, column.name))

        # 3. Save to Cloud
        # cloud_record.sync_status = 'synced' # Cloud doesn't need to know it's synced relative to whom?
        cloud_db.commit()

        # 4. Update Local Status
        record.sync_status = 'synced'
        record.last_synced_at = datetime.now()
        local_db.commit()

    def _resolve_foreign_key(self, local_db, cloud_db, model, local_record, cloud_record, fk_column):
        """
        Map a Local FK ID to a Cloud FK ID using UUID matching.
        Example: record.patient_id (Local 10) -> Cloud Patient (UUID x) -> Cloud ID (25)
        """
        local_fk_id = getattr(local_record, fk_column)
        
        # Determine the related model class based on fk_column name
        # This acts as a simple mapper. 
        # CAUTION: This requires naming convention consistency.
        related_model = None
        if fk_column == 'user_id': related_model = User
        elif fk_column == 'patient_id': related_model = Patient
        elif fk_column == 'practitioner_id': related_model = Practitioner
        
        if not related_model:
            return # Cannot resolve, leave as is (might fail FK constraint if IDs don't match)

        # 1. Find the UUID of the related record in Local DB
        local_related = local_db.query(related_model).filter(related_model.id == local_fk_id).first()
        if not local_related:
            return
        
        related_uuid = local_related.uuid

        # 2. Find the corresponding ID in Cloud DB using UUID
        cloud_related = cloud_db.query(related_model).filter(related_model.uuid == related_uuid).first()
        
        if cloud_related:
            # Set the Cloud record's FK to the Cloud ID
            setattr(cloud_record, fk_column, cloud_related.id)
        else:
            # If dependency not found in cloud, we might need to sync it recursively?
            # Or fail. For now, we rely on MODELS_ORDER to ensure parents are synced first.
            logger.warning(f"Dependency missing in cloud: {fk_column} (UUID {related_uuid})")

    def get_pending_count(self):
        """Count records waiting to be synced."""
        local_db = self.get_local_db()
        count = 0
        try:
            for model in self.MODELS_ORDER:
                count += local_db.query(model).filter(model.sync_status == 'pending').count()
        finally:
            local_db.close()
        return count
