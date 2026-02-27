# Librova
## Library event aggregator app

### 1. Overview

**Project Title:** Librova 
**Mission Statement:** A one-sentence explanation of the "why" (e.g., "Bridging the gap between local libraries and community discovery through automated event aggregation.") 
**The Problem:** Briefly describe the "Manual Input Gap" we discussed—how current platforms require libraries to re-enter data, leading to "data rot." 
**The Solution:** Explain how Librova uses automated "Adapters" to ensure a 100% accurate, zero-friction source of truth.

### 2. Development Methodology: AI-Augmented Engineering
What to say: Focus on the "Human-in-the-loop" aspect.

This project was developed using a "Human-in-the-loop" AI orchestration model. While AI (specifically Gemini and LLM-assisted coding) was used to accelerate the generation of boilerplate and initial adapter logic, all architectural decisions, database schema design (PostGIS), and edge-case resolution (such as complex HTML hierarchy bugs) were manually architected and audited. This approach allowed for rapid prototyping while maintaining high standards for data integrity and system security.

### 3. The Technical Stack 

**Frontend:** Next.js (App Router), Tailwind CSS. 
**Backend/API:** Next.js Serverless Functions, Python (for the scraping engine). 
**Database:** PostgreSQL with PostGIS for spatial queries, hosted on Neon. 
**Deployment:** Vercel.

### 4. Architecture & Data Flow

This is where you show off the "Content Engineer" side of your brain.
**The Adapter Factory:** Explain the modular Python system. How a BaseScraper class allows for quick deployment of new library systems (Assabet, LibCal, etc.).
**Spatial Logic:** Mention how you use ST_DWithin to calculate real-time distance from user coordinates.
**Categorization Engine:** Describe the heuristic keyword-mapping system that automatically tags events for the UI.

graph TD
    subgraph "External Sources"
        A[Assabet Calendars]
        B[LibCal Systems]
        C[WordPress/Custom HTML]
    end

    subgraph "Scraper Engine (Python)"
        D[Base Scraper Class]
        E[Adapter Factory]
        F[Keyword Heuristics Engine]
    end

    subgraph "Database (Neon/PostgreSQL)"
        G[(PostGIS Spatial DB)]
    end

    subgraph "Application (Next.js)"
        H[Serverless API Routes]
        I[React Frontend UI]
    end

    A & B & C --> E
    E --> D
    D --> F
    F -- "UPSERT Logic" --> G
    G <--> H
    H <--> I

### 5. The "Keith" Section (Operational Guide) 
Even if you don't call it "The Keith Section" in the public README, this is the Staff Documentation.Adding a New Library: A 3-step bulleted list on how to create a new adapter.Monitoring Health: Instructions on how to check if a scraper has failed due to an HTML change.Manual Overrides: How to handle those edge cases (like the Red Hook $H3$ vs $H2$ bug).

### 6. Roadmap 
- Search & Discovery: Zip code geocoding and radius sliders.
- Operational Scalability: Moving keywords to the database.
- Monetization: Community Partner tiers and "Featured" placements.

### 7. Local Impact 
(The "Why")Mention the Mid-Hudson Library System specifically.Highlight the goal of supporting the 66 libraries across Dutchess, Ulster, Columbia, Greene, and Putnam counties.