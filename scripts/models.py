from dataclasses import dataclass, asdict
from datetime import datetime
from typing import List, Optional
from zoneinfo import ZoneInfo # Time zone support

@dataclass
class StandardizedEvent:
    title: str
    start_time: datetime
    library_id: int
    description: str = ""
    # Optional fields default to None if the specific calendar doesn't provide them
    end_time: Optional[datetime] = None
    registration_link: Optional[str] = None
    category_ids: Optional[List[int]] = None

    def to_dict(self) -> dict:
        """
        Converts the event to a dictionary, ensuring datetimes are 
        properly formatted to ISO 8601 strings for the JSON payload.
        """
        data = asdict(self)

        # Define the local timezone - CHANGE if deploying outside of EST
        ny_tz = ZoneInfo("America/New_York")
        
        # Ensure datetimes are serialized to strings
        if isinstance(self.start_time, datetime):
            # If the datetime is naive, attach the Eastern timezone
            if self.start_time.tzinfo is None:
                aware_dt = self.start_time.replace(tzinfo=ny_tz)
                data['start_time'] = aware_dt.isoformat()
            else:
                data['start_time'] = self.start_time.isoformat()
            
        if self.end_time and isinstance(self.end_time, datetime):
            if self.end_time.tzinfo is None:
                aware_end = self.end_time.replace(tzinfo=ny_tz)
                data['end_time'] = aware_end.isoformat()
            else:
                data['end_time'] = self.end_time.isoformat()
            
        return data