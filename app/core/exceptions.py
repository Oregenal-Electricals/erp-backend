from fastapi import Request, status
from fastapi.responses import ORJSONResponse
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import IntegrityError


# ── Custom Exceptions ─────────────────────────────────────────────────
class ERPException(Exception):
    def __init__(self, message: str, status_code: int = 400, code: str = "ERP_ERROR"):
        self.message = message
        self.status_code = status_code
        self.code = code
        super().__init__(message)


class NotFoundError(ERPException):
    def __init__(self, resource: str = "Resource"):
        super().__init__(f"{resource} not found", status_code=404, code="NOT_FOUND")


class PermissionError(ERPException):
    def __init__(self, action: str = "perform this action"):
        super().__init__(f"You don't have permission to {action}", status_code=403, code="PERMISSION_DENIED")


class ValidationError(ERPException):
    def __init__(self, message: str):
        super().__init__(message, status_code=422, code="VALIDATION_ERROR")


class ConflictError(ERPException):
    def __init__(self, message: str):
        super().__init__(message, status_code=409, code="CONFLICT")


class WorkflowError(ERPException):
    def __init__(self, message: str):
        super().__init__(message, status_code=400, code="WORKFLOW_ERROR")


class ApprovalError(ERPException):
    def __init__(self, message: str):
        super().__init__(message, status_code=400, code="APPROVAL_ERROR")


# ── Response Helpers ──────────────────────────────────────────────────
def error_response(message: str, status_code: int = 400, code: str = "ERROR", details=None):
    content = {"success": False, "error": {"code": code, "message": message}}
    if details:
        content["error"]["details"] = details
    return ORJSONResponse(status_code=status_code, content=content)


def success_response(data=None, message: str = "Success", status_code: int = 200):
    content = {"success": True, "message": message}
    if data is not None:
        content["data"] = data
    return ORJSONResponse(status_code=status_code, content=content)


# ── Exception Handlers ────────────────────────────────────────────────
async def erp_exception_handler(request: Request, exc: ERPException):
    return error_response(exc.message, exc.status_code, exc.code)


async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = []
    for err in exc.errors():
        field = " → ".join(str(loc) for loc in err["loc"] if loc != "body")
        errors.append({"field": field, "message": err["msg"]})
    return error_response(
        "Validation failed",
        status_code=422,
        code="VALIDATION_ERROR",
        details=errors,
    )


async def integrity_error_handler(request: Request, exc: IntegrityError):
    msg = str(exc.orig)
    if "unique" in msg.lower():
        return error_response("A record with this value already exists", 409, "DUPLICATE")
    if "foreign key" in msg.lower():
        return error_response("Referenced record does not exist", 422, "INVALID_REFERENCE")
    return error_response("Database constraint violation", 409, "DB_ERROR")


async def generic_exception_handler(request: Request, exc: Exception):
    import logging
    logging.error(f"Unhandled exception: {exc}", exc_info=True)
    return error_response("Internal server error", 500, "SERVER_ERROR")
