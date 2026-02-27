# Vendor API Quirks & Data Ingestion Notes

## Overview
Librova aggregates public event data from multiple disparate library calendar systems. Vendor APIs are often undocumented, inconsistent across versions, and subject to change. This document outlines the known edge cases and the architectural decisions made to ensure reliable data ingestion.

## Springshare (LibCal) Integration

### 1. The `iid` vs `id` Discrepancy
Springshare uses an Institution ID to route API requests. 
* **Older Widgets:** Expose this in the source code as `iid` (e.g., `iid: 1205`).
* **Newer Deployments:** Truncate this variable to `id` in their minified JavaScript (e.g., `id: 98212`).
* **Implementation:** The Librova database schema normalizes both under the `iid` column. The `LibCalAdapter` maps this value to the `?iid=` parameter required by the `/widget/` API endpoint.

### 2. The "Master Switch" Calendar ID
Libraries often segment their events into sub-calendars (e.g., Children's, Adult, Tech). 
* Passing `-1` or `0` to the `c` (Calendar ID) parameter acts as a wildcard, commanding the API to return all public events across the entire institution.

### 3. Trailing Slash Normalization
The `base_api_url` in the database must **never** end in a trailing slash. The `LibCalAdapter` dynamically constructs the endpoint (e.g., `{base_api_url}/widget/...`). A trailing slash in the database will result in a malformed `//widget` URL, causing the vendor server to return a 404.

---

## Data Hygiene Layer

### The "Bouncer" (Private Event Filtering)
Library staff frequently use public calendar software to manage internal facility usage. As a result, non-public events are often broadcast to the API.

* **Implementation:** `utils/filtering.py` contains an interceptor that scans incoming events before database insertion.
* **Exclusion Criteria:** Events matching structural keywords like `(comm)`, `Room Reservation`, `Staff Only`, or private social gatherings (`Baby Sprinkle`) are dropped from the pipeline to preserve the integrity of the public-facing UI.