// app/sitemap.ts
import { MetadataRoute } from 'next';
import { neon } from '@neondatabase/serverless';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const sql = neon(process.env.DATABASE_URL!);
  const baseUrl = 'https://www.librova.com';

  // 1. Get all categories and libraries
  const categories = await sql`SELECT tag_name FROM categories`;
  const libraries = await sql`SELECT name, address FROM libraries`;

  const sitemapEntries: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/search`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
  ];

  // 2. Generate the matrix of URLs
  categories.forEach((cat) => {
    libraries.forEach((lib) => {
      // Very basic extraction of a town name from your address column
      const town = lib.address.split(',')[1]?.trim() || lib.name; 
      
      const catSlug = cat.tag_name.toLowerCase().replace(/\s+/g, '-');
      const locSlug = town.toLowerCase().replace(/\s+/g, '-');

      sitemapEntries.push({
        url: `${baseUrl}/explore/${catSlug}/${locSlug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.7,
      });
    });
  });

  return sitemapEntries;
}