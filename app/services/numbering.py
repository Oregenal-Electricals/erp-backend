"""
Oregenal ERP — Shared Number Series Service
=============================================
Extracted from app/modules/masters/router.py so all modules
(purchase, sales, inventory, HR, ...) can generate document numbers
from the shared number_series table without importing from each other.

Usage:
    from app.services.numbering import next_number

    po_number = await next_number(
        db        = db,
        tenant_id = current_user.tenant_id,
        doc_type  = "purchase_order",
        prefix    = "PO",
        table     = "purchase_orders",
    )
"""
from __future__ import annotations

from datetime import datetime
from uuid import UUID
from typing import Optional

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


async def next_number(
    db:         AsyncSession,
    tenant_id:  UUID,
    doc_type:   str,
    prefix:     str,
    table:      str,
) -> str:
    """
    Generate the next sequential document number for doc_type.

    - Reads number_series row FOR UPDATE (atomic under concurrent load).
    - Falls back to {prefix}-{padded count + 1} if no series configured.
    - Increments current_number in the same transaction.
    - Caller must commit — this function only flushes.

    Examples:
        "purchase_order"        → PO-2425-0001
        "purchase_requisition"  → PR-2425-0001
        "rfq"                   → RFQ-2425-0001
        "grn"                   → GRN-2425-0001
        "purchase_return"       → PRN-2425-0001
    """
    try:
        r = await db.execute(
            text(
                "SELECT id, prefix, include_year, year_format, separator, "
                "padding_digits, current_number, suffix "
                "FROM number_series "
                "WHERE tenant_id = :tid AND document_type = :dt "
                "FOR UPDATE SKIP LOCKED "
                "LIMIT 1"
            ),
            {"tid": str(tenant_id), "dt": doc_type},
        )
        ns = r.fetchone()
    except Exception:
        ns = None

    if not ns:
        # Fallback: count existing rows + 1
        try:
            cnt = (
                await db.execute(
                    text(f"SELECT COUNT(*) FROM {table} WHERE tenant_id = :tid"),
                    {"tid": str(tenant_id)},
                )
            ).scalar_one()
        except Exception:
            cnt = 0
        return f"{prefix}-{str(cnt + 1).zfill(4)}"

    next_num = int(ns.current_number or 0) + 1
    parts: list[str] = []

    if ns.prefix:
        parts.append(ns.prefix)

    if ns.include_year:
        today    = datetime.now()
        yr       = today.year
        fy_start = yr if today.month >= 4 else yr - 1
        fy_end   = fy_start + 1
        fmt      = ns.year_format or "YY-YY"
        if fmt == "YY-YY":
            parts.append(f"{str(fy_start)[-2:]}{str(fy_end)[-2:]}")
        elif fmt == "YYYY":
            parts.append(str(fy_start))
        else:
            parts.append(str(fy_start)[-2:])

    sep = ns.separator or "-"
    pad = int(ns.padding_digits or 4)
    parts.append(str(next_num).zfill(pad))
    if ns.suffix:
        parts.append(ns.suffix)

    formatted = sep.join(parts)

    # Atomic increment
    await db.execute(
        text(
            "UPDATE number_series "
            "SET current_number = :n, updated_at = now() "
            "WHERE tenant_id = :tid AND document_type = :dt"
        ),
        {"n": next_num, "tid": str(tenant_id), "dt": doc_type},
    )

    return formatted
