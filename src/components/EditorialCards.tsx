import Image from 'next/image';
import Link from 'next/link';
import {getArticles, type EditorialArticle} from '@/lib/editorial';

export function EditorialCards({articles}: {articles: EditorialArticle[]}) {
  return <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">{articles.map(a => <Link key={a.id} href={`/articles-et-guides/${a.slug}`} className="group flex flex-col overflow-hidden border border-slate-200 bg-white transition-shadow hover:shadow-md"><div className="relative aspect-[16/9] overflow-hidden bg-light">{a.cover_url ? <Image src={a.cover_url} alt={a.cover_alt} fill sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw" unoptimized={a.cover_url.startsWith('https://')} className="object-cover transition-transform duration-300 group-hover:scale-105" /> : <div className="flex h-full items-center justify-center bg-brand text-[18px] font-bold tracking-widest text-white">FICHEASSUR</div>}</div><div className="flex flex-1 flex-col gap-3 p-6"><p className="text-[11px] font-bold uppercase tracking-widest text-brand">{a.kind === 'guide' ? 'Guide' : 'Article'} · {a.category}</p><h3 className="heading text-[23px] leading-tight text-ink group-hover:text-brand">{a.title}</h3><p className="line-clamp-3 text-[14px] leading-relaxed text-slate-600">{a.excerpt}</p><p className="mt-auto pt-3 text-[12px] text-slate-500">{a.author_name} · {a.reading_minutes} min de lecture</p><span className="text-[14px] font-bold text-brand">Lire {a.kind === 'guide' ? 'le guide' : 'l’article'} →</span></div></Link>)}</div>;
}

export default async function LatestEditorial() {
  const data = await getArticles({limit: '3'}).catch(() => null);
  return <section className="w-full py-12"><div className="px-5 lg:px-12 2xl:px-24"><div className="mb-8 flex flex-wrap items-end justify-between gap-5"><div><p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-brand">RESSOURCES POUR LES COURTIERS</p><h2 className="heading text-[30px] leading-tight sm:text-[38px]">Articles & <em>guides.</em></h2></div><Link href="/articles-et-guides" className="text-[14px] font-bold text-brand hover:underline">Toutes les ressources →</Link></div>{data?.items.length ? <EditorialCards articles={data.items} /> : <p className="bg-light p-6 text-[15px] text-slate-600">Retrouvez nos articles et guides pour développer votre activité de courtier.</p>}</div></section>;
}
