import {cache} from 'react';
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://ficheassur.fr').replace(/\/+$/, '');
const API_URL = (process.env.EDITORIAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8100').replace(/\/+$/, '');
export const ARTICLE_CATEGORIES = ['Développement du cabinet', 'Achat de leads', 'Assurance auto', 'Assurance moto', 'Pro de l’automobile', 'Véhicules pro'];
export type EditorialArticle = {id: string; title: string; slug: string; excerpt: string; category: string; kind: 'article' | 'guide'; author_name: string; cover_url: string; cover_alt: string; seo_title: string; seo_description: string; reading_minutes: number; published_at: string; updated_at: string; blocks?: {type: 'heading' | 'paragraph' | 'list'; text: string}[]};
export type EditorialPage = {items: EditorialArticle[]; total: number; page: number; limit: number};
async function read(path: string) {const r = await fetch(`${API_URL}/api/v1/articles${path}`, {cache: 'no-store', signal: AbortSignal.timeout(8000)}); if (r.status === 404) return null; if (!r.ok) throw new Error('Articles temporairement indisponibles.'); return r.json();}
export const getArticle = cache(async (slug: string): Promise<EditorialArticle | null> => read(`/${encodeURIComponent(slug)}`));
export async function getArticles(query: Record<string, string> = {}): Promise<EditorialPage> {const data = await read(`?${new URLSearchParams(query)}`); if (!data) throw new Error('Articles indisponibles.'); return data;}
