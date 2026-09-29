from .analysis import router as analysis_router
from .commodities import router as commodities_router
from .materials import router as materials_router
from .reports import router as reports_router
from .dashboard import router as dashboard_router
from .history import router as history_router
from .sources import router as sources_router

__all__ = [
    "analysis_router",
    "commodities_router",
    "materials_router",
    "reports_router",
    "dashboard_router",
    "history_router",
    "sources_router"
]
