import { MetadataRoute } from 'next';

/**
 * Generate a sitemap for the Asteris Automation platform
 * This helps search engines discover and index all pages
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://asteris.ai';
  
  // Define the main routes of the application
  const routes = [
    '',
    '/dashboard',
    '/automation',
    '/reconciliation',
    '/settings',
    '/configure',
  ];
  
  // Generate sitemap entries for each route
  return routes.map(route => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: route === '' ? 1.0 : 0.8,
  }));
}
