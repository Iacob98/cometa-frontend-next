"""
Authentication Microservice for COMETA
Handles user authentication, authorization, and token management
"""
from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.security import HTTPBearer
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Optional
import os
import sys
import secrets
import logging
from datetime import datetime, timedelta

# Add shared modules to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'shared'))
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', 'shared'))

# Try importing from shared modules first, fall back to local modules
try:
    from shared.database import get_session, get_db
    from shared.schemas import HealthResponse, ErrorResponse
except ImportError:
    from database import get_session
    from schemas import HealthResponse, ErrorResponse
    def get_db() -> Session:
        session = get_session()
        try:
            yield session
        finally:
            session.close()

try:
    from shared.models import User
except ImportError:
    from models import User

# Local schemas and utilities
from schemas import (
    LoginRequest, TokenResponse, UserResponse, UserCreate, UserUpdate,
    HealthCheck, APIResponse
)
from auth_microservice import AuthManager, create_user_token, validate_pin_code, log_auth_activity
from utils import DatabaseUtils, ResponseUtils, ValidationUtils, LoggingUtils

# Setup logging
LoggingUtils.setup_service_logging("auth-service")
logger = logging.getLogger(__name__)

# Database dependency is now imported above

# Helper function for database connection check
def check_database_connection() -> bool:
    """Check if database connection is working"""
    try:
        session = get_session()
        session.execute(text("SELECT 1"))
        session.close()
        return True
    except Exception as e:
        logger.error(f"Database connection check failed: {e}")
        return False

# Initialize FastAPI app
app = FastAPI(
    title="COMETA Authentication Service",
    description="Microservice for user authentication and authorization",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware - Production-ready configuration
allowed_origins = [
    "http://localhost:3000",  # Next.js development
    "http://localhost:8501",  # Streamlit admin
    "http://localhost:8502",  # Streamlit worker
    "http://localhost:8080",  # API Gateway
]

# Add production origins from environment
if os.getenv("PRODUCTION_ORIGINS"):
    allowed_origins.extend(os.getenv("PRODUCTION_ORIGINS").split(","))

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Token"],
)

# Startup event
@app.on_event("startup")
async def startup_event():
    """Initialize service on startup"""
    logger.info("Starting Authentication Service...")

    # Check database connection
    if not check_database_connection():
        logger.error("Failed to connect to database")
        raise RuntimeError("Database connection failed")

    # Database connection verified successfully

    logger.info("Authentication Service started successfully")

# Health check endpoint
@app.get("/health")
async def health_check():
    """Service health check"""
    db_status = check_database_connection()
    return {
        "status": "healthy" if db_status else "unhealthy",
        "service": "auth-service",
        "database": db_status,
        "dependencies": ["database"],
        "timestamp": datetime.now().isoformat()
    }

# Authentication endpoints
@app.post("/login", response_model=TokenResponse)
async def login(
    login_data: LoginRequest,
    db: Session = Depends(get_db)
):
    """
    User login with email/phone + PIN code
    """
    try:
        # Validate input
        if not login_data.email and not login_data.phone:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email or phone required"
            )

        if not login_data.pin_code:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="PIN code required"
            )

        if not validate_pin_code(login_data.pin_code):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid PIN code format"
            )

        # Find user by email or phone
        user_query = db.query(User).filter(User.is_active == True)

        if login_data.email:
            user = user_query.filter(User.email == login_data.email).first()
        else:
            user = user_query.filter(User.phone == login_data.phone).first()

        if not user:
            log_auth_activity("unknown", "login_failed", "User not found")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )

        # Verify PIN code using timing-attack-safe comparison
        pin_valid = secrets.compare_digest(
            str(user.pin_code).encode("utf-8"),
            str(login_data.pin_code).encode("utf-8")
        )

        if not pin_valid:
            log_auth_activity(str(user.id), "login_failed", "Invalid PIN")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )

        # Create access token
        token = create_user_token(
            user_id=str(user.id),
            email=user.email or "",
            role=user.role
        )

        # Log successful login
        log_auth_activity(str(user.id), "login_success")

        return TokenResponse(
            access_token=token,
            token_type="bearer",
            expires_in=30 * 60,  # 30 minutes
            user=UserResponse.from_orm(user)
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Login failed"
        )

@app.post("/verify-token")
async def verify_token(
    token_data: dict = Depends(lambda: AuthManager.verify_token)
):
    """
    Verify JWT token validity
    """
    return ResponseUtils.success_response(
        data=token_data,
        message="Token is valid"
    )

# User management endpoints
@app.get("/users/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: str,
    db: Session = Depends(get_db)
):
    """
    Get user by ID
    """
    user = DatabaseUtils.get_or_404(db, User, user_id, "User")
    return UserResponse.from_orm(user)

@app.post("/users", response_model=UserResponse)
async def create_user(
    user_data: UserCreate,
    db: Session = Depends(get_db)
):
    """
    Create new user
    """
    try:
        # Validate unique constraints
        if user_data.email:
            existing = db.query(User).filter(User.email == user_data.email).first()
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already registered"
                )

        if user_data.phone:
            existing = db.query(User).filter(User.phone == user_data.phone).first()
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Phone already registered"
                )

        # Create user
        user = User(**user_data.dict())
        db.add(user)
        DatabaseUtils.safe_commit(db, "user creation")

        logger.info(f"User created: {user.id}")
        return UserResponse.from_orm(user)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"User creation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="User creation failed"
        )

@app.put("/users/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: str,
    user_data: UserUpdate,
    db: Session = Depends(get_db)
):
    """
    Update user
    """
    try:
        user = DatabaseUtils.get_or_404(db, User, user_id, "User")

        # Update fields
        update_data = user_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(user, field, value)

        DatabaseUtils.safe_commit(db, "user update")

        logger.info(f"User updated: {user.id}")
        return UserResponse.from_orm(user)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"User update error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="User update failed"
        )

@app.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    db: Session = Depends(get_db)
):
    """
    Soft delete user (set inactive)
    """
    try:
        user = DatabaseUtils.get_or_404(db, User, user_id, "User")
        user.is_active = False

        DatabaseUtils.safe_commit(db, "user deletion")

        logger.info(f"User deactivated: {user.id}")
        return ResponseUtils.success_response(message="User deactivated")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"User deletion error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="User deletion failed"
        )

@app.get("/users", response_model=dict)
async def list_users(
    page: int = 1,
    per_page: int = 50,
    role: Optional[str] = None,
    active_only: bool = True,
    db: Session = Depends(get_db)
):
    """
    List users with pagination and filtering
    """
    try:
        query = db.query(User)

        if active_only:
            query = query.filter(User.is_active == True)

        if role:
            query = query.filter(User.role == role)

        query = query.order_by(User.first_name, User.last_name)

        result = DatabaseUtils.paginate_query(query, page, per_page)

        # Convert to response format
        users = [UserResponse.from_orm(user) for user in result["items"]]

        return ResponseUtils.paginated_response(
            items=users,
            total=result["total"],
            page=result["page"],
            per_page=result["per_page"]
        )

    except Exception as e:
        logger.error(f"User listing error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to list users"
        )

# PIN code management
@app.post("/users/{user_id}/pin")
async def set_user_pin(
    user_id: str,
    pin_data: dict,
    db: Session = Depends(get_db)
):
    """
    Set or update user PIN code
    """
    try:
        user = DatabaseUtils.get_or_404(db, User, user_id, "User")

        pin_code = pin_data.get("pin_code")
        if not pin_code or not validate_pin_code(pin_code):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid PIN code format (4-6 digits required)"
            )

        user.pin_code = pin_code
        DatabaseUtils.safe_commit(db, "PIN update")

        logger.info(f"PIN updated for user: {user.id}")
        return ResponseUtils.success_response(message="PIN code updated")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"PIN update error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="PIN update failed"
        )

# Service info endpoint
@app.get("/info")
async def service_info():
    """
    Service information
    """
    return {
        "service": "auth-service",
        "version": "1.0.0",
        "description": "COMETA Authentication Service",
        "endpoints": [
            "POST /login",
            "POST /verify-token",
            "GET /users",
            "POST /users",
            "GET /users/{user_id}",
            "PUT /users/{user_id}",
            "DELETE /users/{user_id}",
            "POST /users/{user_id}/pin"
        ]
    }

if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("AUTH_SERVICE_PORT", 8001))

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=os.getenv("DEBUG", "false").lower() == "true",
        log_level="info"
    )