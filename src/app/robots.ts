import type {MetadataRoute} from 'next';
import {SITE_URL} from '@/lib/editorial';
export default function robots(): MetadataRoute.Robots {return {rules: {userAgent: '*', allow: '/', disallow: ['/espace-pro/', '/auth/', '/activer', '/apercu/']}, sitemap: `${SITE_URL}/sitemap.xml`};}
