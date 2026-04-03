import { literaryArticles } from '../../../data/literary-articles';
import LiteraryArticleClient from './client';

export const dynamic = 'force-static';

export async function generateStaticParams() {
  return literaryArticles.map((article) => ({
    slug: article.slug,
  }));
}

export default function LiteraryArticlePage() {
  return <LiteraryArticleClient />;
}
