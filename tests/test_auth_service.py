import pytest
from src.services import auth_service
from src.database.models import User
from fastapi import HTTPException
from unittest.mock import MagicMock

def test_verify_password():
    password = "secret_password"
    hashed = auth_service.get_password_hash(password)
    assert auth_service.verify_password(password, hashed) is True
    assert auth_service.verify_password("wrong_password", hashed) is False

def test_get_user(db_session):
    # Setup
    user = User(username="testuser", real_name="Test User", email="test@example.com", hashed_password="hashed")
    db_session.add(user)
    db_session.commit()
    
    # Test
    fetched_user = auth_service.get_user_by_username(db_session, "testuser")
    assert fetched_user is not None
    assert fetched_user.email == "test@example.com"
    
    non_existent = auth_service.get_user_by_username(db_session, "nobody")
    assert non_existent is None

def test_create_user(db_session):
    user_data = {
        "username": "newuser",
        "real_name": "New User",
        "email": "new@example.com",
        "password": "password123",
        "role": "practitioner"
    }
    
    new_user = auth_service.create_user(db_session, user_data)
    assert new_user.username == "newuser"
    assert new_user.role == "practitioner"
    # By default created users are inactive
    assert new_user.is_active is False
    
    # Check password hashed
    assert new_user.hashed_password != "password123"

def test_login_endpoint(client, db_session):
    # Create active user
    hashed = auth_service.get_password_hash("password123")
    user = User(username="loginuser", hashed_password=hashed, is_active=True, role="practitioner")
    db_session.add(user)
    db_session.commit()
    
    response = client.post("/api/auth/login", data={"username": "loginuser", "password": "password123"})
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

def test_login_endpoint_fail(client, db_session):
    response = client.post("/api/auth/login", data={"username": "wrong", "password": "wrong"})
    assert response.status_code == 401
