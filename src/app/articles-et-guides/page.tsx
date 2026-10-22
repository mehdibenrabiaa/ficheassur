import {Suspense} from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type {Metadata} from 'next';
import Navbar from '@/components/Navbar';
import {SiteFooter} from '@/components/SiteChrome';
import {EditorialCards} from '@/components/EditorialCards';
import {ARTICLE_CATEGORIES, SITE_URL, getArticles} from '@/lib/editorial';
type Query = Promise<Record<string, string | string[] | undefined>>;
export const metadata: Metadata = {title: 'Articles & guides pour courtiers en assurance | FicheAssur', description: 'Découvrez les ressources FicheAssur sur l’achat de leads assurance, la qualification des prospects et le développement de votre cabinet.', alternates: {canonical: `${SITE_URL}/articles-et-guides`}};
async function Results({searchParams}: {searchParams: Query}) {
  const raw = await searchParams; const str = (key: string) => typeof raw[key] === 'string' ? raw[key] as string : '';
  const q = str('q').slice(0, 200); const category = ARTICLE_CATEGORIES.includes(str('category')) ? str('category') : ''; const kind = ['article', 'guide'].includes(str('kind')) ? str('kind') : '';
  const page = Math.max(1, Number.parseInt(str('page'), 10) || 1);
  const data = await getArticles({q, ...(category && {category}), ...(kind && {kind}), page: String(page)});
  const pageHref = (n: number) => `/articles-et-guides?${new URLSearchParams({q, category, kind, page: String(n)})}`;
  return <><form action="/articles-et-guides" className="mb-10 grid gap-4 border border-slate-200 bg-light p-5 md:grid-cols-[2fr_1.5fr_1fr_auto]"><label className="flex flex-col gap-2 text-[12px] font-bold">Rechercher<input name="q" defaultValue={q} placeholder="Sujet, question…" className="h-12 border border-slate-200 bg-white px-4 font-normal" /></label><label className="flex flex-col gap-2 text-[12px] font-bold">Catégorie<select name="category" defaultValue={category} className="h-12 border border-slate-200 bg-white px-3 font-normal"><option value="">Toutes les catégories</option>{ARTICLE_CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></label><label className="flex flex-col gap-2 text-[12px] font-bold">Format<select name="kind" defaultValue={kind} className="h-12 border border-slate-200 bg-white px-3 font-normal"><option value="">Tous</option><option value="article">Articles</option><option value="guide">Guides</option></select></label><button className="h-12 self-end bg-brand px-6 font-bold text-white">Rechercher</button></form><p className="mb-6 text-[13px] text-slate-500">{data.total} ressource{data.total === 1 ? '' : 's'}</p>{data.items.length ? <EditorialCards articles={data.items} /> : <div className="bg-light p-10 text-center"><h2 className="heading text-[25px]">{q || category || kind ? 'Aucun résultat pour cette recherche.' : 'Nos premiers articles arrivent bientôt.'}</h2><p className="mt-3 text-[15px] text-slate-600">{q || category || kind ? 'Essayez un autre sujet ou consultez toutes les ressources.' : 'Nous préparons des ressources pratiques pour votre activité de courtier.'}</p>{!!(q || category || kind) && <Link href="/articles-et-guides" className="mt-5 inline-block font-bold text-brand">Toutes les ressources →</Link>}</div>}<nav aria-label="Pagination des articles" className="mt-10 flex items-center justify-between text-[14px] font-semibold">{page > 1 ? <Link href={pageHref(page - 1)}>← Précédent</Link> : <span />}<span>Page {page} / {Math.max(1, Math.ceil(data.total / data.limit))}</span>{page * data.limit < data.total ? <Link href={pageHref(page + 1)}>Suivant →</Link> : <span />}</nav></>;
}
export default function ArticlesPage({searchParams}: {searchParams: Query}) {
  return <><Navbar /><main>
    <header className="relative overflow-hidden bg-brand text-white lg:min-h-[460px]">
      <div className="relative h-[220px] sm:h-[300px] lg:absolute lg:inset-0 lg:h-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <picture><source media="(max-width: 1023px)" srcSet="/heroes/articles-mobile.webp" /><img src="/heroes/articles-desktop.webp" alt="Un conseiller en assurance accompagne un client" fetchPriority="high" className="absolute inset-0 h-full w-full object-cover" /></picture>
        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-brand to-transparent lg:inset-0 lg:h-auto lg:bg-gradient-to-r lg:from-brand/95 lg:via-brand/70 lg:to-brand/10" />
      </div>
      <div className="relative px-5 pb-12 pt-4 sm:px-8 lg:px-12 lg:pb-14 lg:pt-16 2xl:px-24">
        <nav aria-label="Fil d’Ariane" className="mb-8 text-[13px] text-white/80"><Link href="/" className="hover:text-white">Accueil</Link><span className="mx-2">/</span><span aria-current="page">Articles & guides</span></nav>
        <div className="max-w-3xl">
          <p className="mb-4 text-[11px] font-bold uppercase tracking-widest text-sky">LE RENDEZ-VOUS DES COURTIERS</p>
          <h1 className="heading text-[40px] leading-[1.05] sm:text-[50px] md:text-[56px] lg:text-[58px] xl:text-[64px] 2xl:text-[76px]">Des conseils pour<br /><em>faire grandir votre cabinet.</em></h1>
          <p className="mt-6 max-w-xl text-[16px] leading-relaxed text-white/85 sm:text-[18px]">Achat de leads, qualification et suivi commercial : des articles et des guides pour avancer dans votre quotidien de courtier.</p>
          <a href="#ressources" className="mt-7 inline-flex items-center gap-4 border-b border-white/50 pb-2 text-sm font-semibold">Explorer les ressources <span aria-hidden="true">↓</span></a>
        </div>
      </div>
    </header>
    <Suspense fallback={null}><FeaturedArticle /></Suspense>
    <section id="ressources" className="scroll-mt-24 px-5 py-12 lg:px-12 2xl:px-24">
      <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-brand">LA BIBLIOTHÈQUE FICHEASSUR</p>
      <h2 className="heading mb-8 text-[30px] sm:text-[38px]">Tous nos articles <em>& guides.</em></h2>
      <Suspense fallback={<p role="status">Chargement des ressources…</p>}><Results searchParams={searchParams} /></Suspense>
    </section>
  </main><SiteFooter /></>;
}

async function FeaturedArticle() {
  const article = (await getArticles({limit: '1'})).items[0];
  if (!article) return null;
  return <section className="px-5 pt-12 lg:px-12 2xl:px-24">
    <Link href={`/articles-et-guides/${article.slug}`} className="group grid overflow-hidden bg-light md:grid-cols-2">
      <div className="relative min-h-64 md:min-h-80">{article.cover_url && <Image src={article.cover_url} alt={article.cover_alt} fill sizes="(min-width: 768px) 50vw, 100vw" unoptimized={article.cover_url.startsWith('https://')} className="object-cover" />}</div>
      <div className="flex flex-col justify-center p-7 lg:p-12">
        <p className="mb-4 text-[11px] font-bold uppercase tracking-widest text-brand">À LA UNE · {article.kind === 'guide' ? 'GUIDE' : 'ARTICLE'}</p>
        <h2 className="heading text-[28px] leading-tight group-hover:text-brand lg:text-[36px]">{article.title}</h2>
        <p className="mt-5 text-[15px] leading-relaxed text-slate-600">{article.excerpt}</p>
        <p className="mt-5 text-xs text-slate-500">{article.author_name} · {article.reading_minutes} min de lecture</p>
        <span className="mt-6 text-sm font-bold text-brand">Lire la suite →</span>
      </div>
    </Link>
  </section>;
}
