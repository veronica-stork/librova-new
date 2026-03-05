import pytest
from bs4 import BeautifulSoup
from unittest.mock import patch, Mock
from datetime import datetime, timezone, timedelta

from adapters.my_calendar import MyCalendarAdapter
from models import StandardizedEvent

# 1. The raw HTML snippet you provided from the ticket
MOCK_CALENDAR_HTML = """
<td id="calendar-2026-03-05" class="mc-events thursday thu future-day has-events author3 mcat_general day-with-date" role="cell">
    <div class="mc-date-container">
        <span class="mc-date">
            <span aria-hidden="true" class="mc-day-number">5</span>
            <span class="screen-reader-text mc-day-date">March 5, 2026</span>
            <span class="event-icon" aria-hidden="true">●</span>
            <span class="screen-reader-text"><span class="mc-list-details event-count">(1 event)</span></span>
        </span>
    </div>
    <article id="mc_calendar_05_2369-calendar-2369" class="mc-mc_calendar_2369 calendar-event mc_general mc_no-location future-event mc_primary_general nonrecurring mc mc-start-14-00 ungrouped mc-event-262 mc-events mc-event mc_rel_general">
        <header>
            <h3 class="event-title summary" id="mc_2369-title-mc-948a6a8e8cd15db324902317a630b853">
                <button type="button" aria-expanded="true" aria-controls="mc_calendar_05_2369-calendar-details-2369" class="calendar open url summary has-image" data-action="shiftforward">
                    <div>2:00 pm: Award-Worthy Film Series: "One Battle After Another"</div>
                </button>
            </h3>
        </header>
        <div id="mc_calendar_05_2369-calendar-details-2369" class="details no-image single-details" aria-labelledby="mc_2369-title-mc-948a6a8e8cd15db324902317a630b853" style="display: none;">
            <h4 class="mc-title">2:00 pm: Award-Worthy Film Series: "One Battle After Another"</h4>
            <div class="time-block">
                <p>
                    <span class="time-wrapper">
                        <span class="event-time dtstart">
                            <time class="value-title" datetime="2026-03-05T14:00:00-05:00" title="2026-03-05T14:00:00-05:00">2:00 pm</time>
                        </span>  
                    </span><br>
                    <span class="date-wrapper">
                        <span class="mc-start-date dtstart" title="2026-03-05T14:00:00-05:00" content="2026-03-05T14:00:00-05:00">March 5, 2026</span>  
                    </span>
                </p>
            </div>
            <div class="sharing">
                <p class="mc-details">
                    <a aria-label="Read more" href="https://newlebanonlibrary.org/mc-events/award-worthy-film-series-one-battle-after-another/" data-action="shiftback">Read more</a>
                </p>
            </div>
        </div>
    </article>
</td>
"""

# 2. Mock HTML for the secondary "Read more" page fetch
MOCK_DETAIL_HTML = """
<html>
    <body>
        <div class="mc-description">
            <p>Join us for a screening of an award-worthy documentary.</p>
            <p>Refreshments will be provided.</p>
        </div>
    </body>
</html>
"""

@pytest.fixture
def adapter():
    """Sets up the adapter with a dummy library ID and URL."""
    return MyCalendarAdapter(library_id=101, target_url="https://fake-library.org/calendar")

@patch('adapters.my_calendar.requests.get')
def test_normalize_data(mock_get, adapter):
    """
    Tests that the adapter correctly parses the provided HTML snippet 
    and handles the secondary description fetch.
    """
    
    # Setup the mock to return our detail page HTML when fetch_event_description triggers
    detail_response_mock = Mock()
    detail_response_mock.text = MOCK_DETAIL_HTML
    detail_response_mock.raise_for_status = Mock()
    mock_get.return_value = detail_response_mock

    # Convert our mock calendar snippet into a BeautifulSoup object
    soup = BeautifulSoup(MOCK_CALENDAR_HTML, 'html.parser')
    
    # Run the normalization
    events = adapter.normalize_data(soup)

    # Asserts
    assert len(events) == 1, "Should have parsed exactly one event from the HTML."
    event = events[0]

    # 1. Check Type
    assert isinstance(event, StandardizedEvent)

    # 2. Check Title (Ensure the "2:00 pm: " prefix was stripped)
    assert event.title == 'Award-Worthy Film Series: "One Battle After Another"'

    # 3. Check Library ID
    assert event.library_id == 101

    # 4. Check URL extraction
    assert event.event_url == "https://newlebanonlibrary.org/mc-events/award-worthy-film-series-one-battle-after-another/"

    # 5. Check Datetime Parsing (2026-03-05 at 14:00:00 EST/EDT)
    # The ISO string has a -05:00 offset, so we create an aware datetime to match against
    expected_tz = timezone(timedelta(hours=-5))
    expected_time = datetime(2026, 3, 5, 14, 0, tzinfo=expected_tz)
    assert event.start_time == expected_time

    # 6. Check Description Extraction & Cleaning (Should pull from MOCK_DETAIL_HTML and convert <p> tags)
    expected_description = "Join us for a screening of an award-worthy documentary.\nRefreshments will be provided."
    assert event.description == expected_description

    # 7. Ensure requests.get was called once for the detail page
    mock_get.assert_called_once_with(
        "https://newlebanonlibrary.org/mc-events/award-worthy-film-series-one-battle-after-another/",
        headers=adapter.headers,
        timeout=10
    )