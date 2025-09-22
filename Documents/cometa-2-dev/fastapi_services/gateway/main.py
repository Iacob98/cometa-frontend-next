"""
API Gateway for COMETA Microservices
Central entry point for all microservice communication with routing, authentication, and rate limiting
"""
from fastapi import FastAPI, HTTPException, Depends, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import httpx
import os
import sys
import logging
from typing import Optional
import asyncio
from datetime import datetime

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("api-gateway")

# Initialize FastAPI app
app = FastAPI(
    title="COMETA API Gateway",
    description="Central API Gateway for COMETA microservices",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware - Production-ready configuration
allowed_origins = [
    "http://localhost:3000",  # Next.js development
    "http://localhost:8501",  # Streamlit admin
    "http://localhost:8502",  # Streamlit worker
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

# Service registry with Docker service names and localhost fallback
import os
DOCKER_MODE = os.getenv('DOCKER_MODE', 'false').lower() == 'true'

if DOCKER_MODE:
    # Docker container service names
    SERVICES = {
        "auth": "http://auth-service:8001",
        "project": "http://project-service:8002",
        "team": "http://team-service:8004",
        "work": "http://work-service:8003",
        "material": "http://material-service:8005",
        "equipment": "http://equipment-service:8006",
        "activity": "http://activity-service:8011"
    }
else:
    # Local development service URLs
    SERVICES = {
        "auth": "http://localhost:8001",
        "project": "http://localhost:8002",
        "team": "http://localhost:8004",
        "work": "http://localhost:8003",
        "material": "http://localhost:8005",
        "equipment": "http://localhost:8006",
        "activity": "http://localhost:8007"
    }

# HTTP client for service communication
client = httpx.AsyncClient(timeout=30.0)

@app.on_event("startup")
async def startup_event():
    logger.info("Starting API Gateway...")
    logger.info("API Gateway started successfully")

@app.on_event("shutdown")
async def shutdown_event():
    await client.aclose()

@app.get("/health")
async def health_check():
    """Gateway health check"""
    return {
        "status": "healthy",
        "service": "api-gateway",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/health/services")
async def check_services_health():
    """Check health of all registered services"""
    service_status = {}

    async def check_service(service_name: str, service_url: str):
        try:
            response = await client.get(f"{service_url}/health", timeout=5.0)
            service_status[service_name] = {
                "status": "healthy" if response.status_code == 200 else "unhealthy",
                "url": service_url,
                "response_time": response.elapsed.total_seconds() if hasattr(response, 'elapsed') else None
            }
        except Exception as e:
            service_status[service_name] = {
                "status": "unreachable",
                "url": service_url,
                "error": str(e)
            }

    # Check all services concurrently
    tasks = [check_service(name, url) for name, url in SERVICES.items()]
    await asyncio.gather(*tasks)

    healthy_services = sum(1 for s in service_status.values() if s["status"] == "healthy")
    total_services = len(service_status)

    return {
        "gateway_status": "healthy",
        "services": service_status,
        "summary": {
            "healthy": healthy_services,
            "total": total_services,
            "health_percentage": (healthy_services / total_services * 100) if total_services > 0 else 0
        },
        "timestamp": datetime.now().isoformat()
    }

async def forward_request(service_name: str, path: str, method: str, request: Request):
    """Forward request to appropriate microservice"""
    if service_name not in SERVICES:
        raise HTTPException(status_code=404, detail=f"Service '{service_name}' not found")

    service_url = SERVICES[service_name]
    target_url = f"{service_url}{path}"

    # Prepare headers (exclude host and content-length)
    headers = dict(request.headers)
    headers.pop("host", None)
    headers.pop("content-length", None)

    try:
        # Get request body if present
        body = None
        if method.upper() in ["POST", "PUT", "PATCH"]:
            body = await request.body()

        # Forward request to service
        response = await client.request(
            method=method,
            url=target_url,
            headers=headers,
            params=request.query_params,
            content=body
        )

        # Return response
        return JSONResponse(
            content=response.json() if response.headers.get("content-type", "").startswith("application/json") else response.text,
            status_code=response.status_code,
            headers={"X-Forwarded-From": service_name}
        )

    except httpx.RequestError as e:
        logger.error(f"Request error forwarding to {service_name}: {e}")
        raise HTTPException(status_code=502, detail=f"Service '{service_name}' unavailable")
    except Exception as e:
        logger.error(f"Unexpected error forwarding to {service_name}: {e}")
        raise HTTPException(status_code=500, detail="Gateway error")

# Authentication service routes
@app.api_route("/api/auth/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def auth_routes(path: str, request: Request):
    """Route authentication requests"""
    return await forward_request("auth", f"/{path}", request.method, request)

# Project service routes
@app.api_route("/api/projects/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def project_routes(path: str, request: Request):
    """Route project management requests"""
    return await forward_request("project", f"/projects/{path}", request.method, request)

@app.api_route("/api/projects", methods=["GET", "POST"])
async def project_base_routes(request: Request):
    """Route base project requests"""
    return await forward_request("project", "/projects", request.method, request)

# Team service routes
@app.api_route("/api/teams/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def team_routes(path: str, request: Request):
    """Route team management requests"""
    return await forward_request("team", f"/teams/{path}", request.method, request)

@app.api_route("/api/teams", methods=["GET", "POST"])
async def team_base_routes(request: Request):
    """Route base team requests"""
    return await forward_request("team", "/teams", request.method, request)

# Work service routes
@app.api_route("/api/work-entries/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def work_routes(path: str, request: Request):
    """Route work entry requests"""
    return await forward_request("work", f"/work-entries/{path}", request.method, request)

@app.api_route("/api/work-entries", methods=["GET", "POST"])
async def work_base_routes(request: Request):
    """Route base work entry requests"""
    return await forward_request("work", "/work-entries", request.method, request)

# Material service routes
@app.api_route("/api/materials/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def material_routes(path: str, request: Request):
    """Route material management requests"""
    return await forward_request("material", f"/materials/{path}", request.method, request)

@app.api_route("/api/materials", methods=["GET", "POST"])
async def material_base_routes(request: Request):
    """Route base material requests"""
    return await forward_request("material", "/materials", request.method, request)

# Equipment service routes
@app.api_route("/api/equipment/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def equipment_routes(path: str, request: Request):
    """Route equipment management requests"""
    return await forward_request("equipment", f"/equipment/{path}", request.method, request)

@app.api_route("/api/equipment", methods=["GET", "POST"])
async def equipment_base_routes(request: Request):
    """Route base equipment requests"""
    return await forward_request("equipment", "/equipment", request.method, request)

# Activity service routes
@app.api_route("/api/activities/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def activity_routes(path: str, request: Request):
    """Route activity logging requests"""
    return await forward_request("activity", f"/activities/{path}", request.method, request)

@app.api_route("/api/activities", methods=["GET", "POST"])
async def activity_base_routes(request: Request):
    """Route base activity requests"""
    return await forward_request("activity", "/activities", request.method, request)

# Service discovery endpoint
@app.get("/api/services")
async def get_services():
    """Get list of available services"""
    return {
        "services": SERVICES,
        "gateway_version": "1.0.0",
        "total_services": len(SERVICES)
    }

# Load balancing and circuit breaker could be added here
@app.get("/api/stats")
async def get_gateway_stats():
    """Get gateway statistics"""
    # In a real implementation, this would track request counts, response times, etc.
    return {
        "total_services": len(SERVICES),
        "active_services": len(SERVICES),  # This should be dynamic based on health checks
        "gateway_uptime": "running",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)