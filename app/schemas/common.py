from typing import Generic, List, Optional, TypeVar, Any
from pydantic import BaseModel

T = TypeVar("T")


class PaginatedResponse(BaseModel, Generic[T]):
    """Standard paginated list response."""
    items: List[T]
    total: int
    page: int
    page_size: int
    total_pages: int

    @classmethod
    def create(cls, items: List[T], total: int, page: int, page_size: int):
        import math
        return cls(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=math.ceil(total / page_size) if page_size else 1,
        )


class APIResponse(BaseModel, Generic[T]):
    """Standard API response envelope."""
    success: bool = True
    message: str = "Success"
    data: Optional[T] = None


class ErrorResponse(BaseModel):
    success: bool = False
    error: dict


class SuccessResponse(BaseModel):
    success: bool = True
    message: str


class IDResponse(BaseModel):
    id: str
    message: str = "Created successfully"


# ── Filter / Sort helpers ─────────────────────────────────────────────
class DateRangeFilter(BaseModel):
    date_from: Optional[str] = None
    date_to: Optional[str] = None


class SortParams(BaseModel):
    sort_by: Optional[str] = None
    sort_dir: str = "desc"   # asc | desc
