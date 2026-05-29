import { neon } from '@neondatabase/serverless';
import Link from 'next/link';
import { ArrowRight, Calendar, MapPin, Info } from 'lucide-react';

// --- 1. METADATA ---
export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ category: string, location: string }> 
}) {
  const { category, location } = await params;
  const categoryName = category.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  const locationName = location.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  return {
    title: `Free ${categoryName} Events Near ${locationName} | Librova`,
    description: `Looking for free ${categoryName.toLowerCase()} events near ${locationName}? Librova indexes local public library programs so you don't have to search.`,
  }
}

// --- 2. MAIN PAGE ---
export default async function ProgrammaticLandingPage({ 
  params 
}: { 
  params: Promise<{ category: string, location: string }> 
}) {
  const { category, location } = await params;
  const sql = neon(process.env.DATABASE_URL!);
  
  const categorySlug = category.replace(/-/g, ' ');
  const locationSlug = location.replace(/-/g, ' ');

  // PostGIS spatial query (15-mile radius)
  const events = await sql`
    WITH TargetEpicenter AS (
      SELECT location FROM libraries
      WHERE address ILIKE ${'%' + locationSlug + '%'}
      LIMIT 1
    )
    SELECT 
      e.id, 
      e.title, 
      e.start_time, 
      e.event_url,
      l.name AS library_name,
      c.tag_name AS category_name
    FROM events e
    JOIN categories c ON e.primary_category_id = c.id
    JOIN libraries l ON e.library_id = l.id
    CROSS JOIN TargetEpicenter
    WHERE c.tag_name ILIKE ${categorySlug}
    AND ST_DWithin(l.location, TargetEpicenter.location, 24140) 
    AND e.start_time > NOW()
    ORDER BY e.start_time ASC
    LIMIT 15
  `;

  return (
    <div className="min-h-screen bg-librova-light pb-12 font-sans">
      
      {/* 1. Global Navigation Bar */}
      <nav className="bg-white shadow-sm border-b border-librova-border sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl text-librova-dark tracking-tight hover:opacity-90 transition">
            {/* Simple logo representation to make it feel like the real app */}
            <div className="w-8 h-8 bg-librova-teal rounded-lg flex items-center justify-center text-white font-serif font-bold text-lg">
              L
            </div>
            Librova
          </Link>
          <Link href="/search" className="text-sm font-semibold text-librova-dark/70 hover:text-librova-teal flex items-center gap-1.5 transition">
            Explore All Regions <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </nav>

      {/* 2. The Native "Hero" Section */}
      <div className="bg-white border-b border-librova-border pt-12 pb-14 mb-8 shadow-sm">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <span className="inline-block px-3 py-1 mb-4 text-xs font-bold tracking-wider text-librova-teal uppercase bg-librova-teal/10 border border-librova-teal/20 rounded-full">
            Community Directory
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold text-librova-dark tracking-tight capitalize mb-4 leading-tight">
            Free {categorySlug} Events Near {locationSlug}
          </h1>
          <p className="text-lg md:text-xl text-librova-dark/70 max-w-2xl mx-auto mb-8">
            Discover programs, workshops, and activities happening within a 15-mile radius of your local network.
          </p>

          {/* Integrated Trust Signal */}
          <div className="bg-librova-light border border-librova-border rounded-xl p-4 text-left flex items-start gap-4 max-w-2xl mx-auto shadow-inner">
             <Info className="w-5 h-5 text-librova-teal shrink-0 mt-0.5" />
             <p className="text-sm text-librova-dark/80 leading-relaxed">
               <strong className="text-librova-dark font-bold">How Librova works:</strong> Finding quality local activities shouldn't require checking a dozen websites. We automatically sync with public library calendars across the region daily to build this directory. Click "More Info" to register directly on the host library's official website.
             </p>
          </div>
        </div>
      </div>

      {/* 3. Event Feed */}
      <main className="max-w-3xl mx-auto px-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-librova-dark">Upcoming Schedule</h2>
          {/* Subtle freshness signal */}
          <span className="text-xs text-librova-dark/40 font-bold uppercase tracking-wide">
            Live Database
          </span>
        </div>

        <div className="space-y-4">
          {events.length > 0 ? (
            events.map(event => {
              const eventDate = new Date(event.start_time).toLocaleDateString('en-US', {
                weekday: 'short', month: 'short', day: 'numeric'
              });
              const eventTime = new Date(event.start_time).toLocaleTimeString('en-US', {
                hour: 'numeric', minute: '2-digit'
              });

              return (
                <div key={event.id} className="p-5 border border-librova-border rounded-xl bg-white shadow-sm hover:shadow-md hover:border-librova-teal transition-all group">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="text-xs font-bold tracking-wider uppercase bg-librova-teal/10 text-librova-teal px-2 py-1 rounded-md">
                          {event.category_name}
                        </span>
                      </div>
                      <h3 className="font-bold text-xl text-librova-dark leading-tight group-hover:text-librova-teal transition-colors">
                        {event.title}
                      </h3>
                      
                      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-librova-dark/70 font-medium">
                        <span className="flex items-center gap-1.5 bg-librova-light px-2 py-1 rounded-md border border-librova-border">
                          <MapPin className="w-3.5 h-3.5 text-librova-teal" /> {event.library_name}
                        </span>
                        <span className="flex items-center gap-1.5 bg-librova-light px-2 py-1 rounded-md border border-librova-border">
                          <Calendar className="w-3.5 h-3.5 text-librova-teal" /> {eventDate} • {eventTime}
                        </span>
                      </div>
                    </div>
                    
                    <a 
                      href={event.event_url || '#'} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="shrink-0 bg-white border-2 border-librova-border hover:border-librova-teal hover:bg-librova-teal/10 hover:text-librova-teal text-librova-dark/80 font-bold text-sm px-6 py-2.5 rounded-lg transition-all text-center"
                    >
                      More Info
                    </a>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="text-center py-16 bg-white rounded-2xl border border-librova-border shadow-sm">
              <Calendar className="w-12 h-12 text-librova-dark/20 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-librova-dark mb-2">No Upcoming Events</h3>
              <p className="text-librova-dark/60 mb-6 max-w-sm mx-auto">
                We couldn't find any {categorySlug} events within 15 miles of {locationSlug} right now.
              </p>
              <Link href="/search" className="inline-flex items-center gap-2 bg-librova-accent border-b-4 border-librova-red text-white font-bold px-6 py-3 rounded-xl hover:opacity-90 active:border-b-0 active:translate-y-1 transition-all shadow-sm">
                Browse All Regions <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// --- 3. STATIC GENERATION ---
export async function generateStaticParams() {
  const sql = neon(process.env.DATABASE_URL!);
  
  const categories = await sql`SELECT tag_name FROM categories`;
  const libraries = await sql`SELECT name, address FROM libraries`;

  const paths: { category: string, location: string }[] = [];

  categories.forEach((cat) => {
    libraries.forEach((lib) => {
      const town = lib.address.split(',')[1]?.trim() || lib.name;
      
      paths.push({
        category: cat.tag_name.toLowerCase().replace(/\s+/g, '-'),
        location: town.toLowerCase().replace(/\s+/g, '-'),
      });
    });
  });

  return paths; 
}