from typing import Optional
from pydantic import BaseModel, Field

class ResearchSource(BaseModel):
    id: str
    title: str = Field(..., description="Publication title or standard designation")
    source_type: str = Field(..., description="Research Paper, Government Source, Standard, Manufacturer Datasheet")
    authors: Optional[str] = None
    publication_year: Optional[int] = None
    url: Optional[str] = None
    parameter: Optional[str] = None
    value: Optional[str] = None
    confidence: Optional[str] = Field(default="High", description="Confidence level: High, Medium, Low")

    class Config:
        from_attributes = True
