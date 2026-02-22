from dataclasses import dataclass, asdict
from datetime import datetime
from typing import Optional

@dataclass
class StandardizedEvent:
    title: str
    start_time: datetime
    library_id: int
    description: str = ""
    # Optional fields default to None if the specific calendar doesn't provide them
    end_time: Optional[datetime] = None
    registration_link: Optional[str] = None
    category_id: Optional[int] = None

    def to_dict(self) -> dict:
        """
        Converts the event to a dictionary, ensuring datetimes are 
        properly formatted to ISO 8601 strings for the JSON payload.
        """
        data = asdict(self)
        
        # Ensure datetimes are serialized to strings
        if isinstance(self.start_time, datetime):
            data['start_time'] = self.start_time.isoformat()
            
        if self.end_time and isinstance(self.end_time, datetime):
            data['end_time'] = self.end_time.isoformat()
            
        return data