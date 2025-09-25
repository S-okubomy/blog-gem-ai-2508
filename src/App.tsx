import React, { useState, useEffect, useCallback } from 'react';
import type { Article, View, Source } from './types';
import { generateBlogPost } from './services/geminiService';
import { getArticles, getArticlesCount, addArticle, updateArticle, deleteArticle, getArticleById } from './services/firebaseService';
import Header from './components/Header';
import Footer from './components/Footer';
import ShareButtons from './components/ShareButtons';
import { SparklesIcon, PublishIcon, RegenerateIcon, BackIcon, EditIcon, TrashIcon, HeartIcon, TagIcon, CalendarIcon, ExternalLinkIcon, CherryBlossomIcon } from './components/icons';
import { useAuth } from './contexts/AuthContext';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import AffiliateAd from './components/AffiliateAd';
import firebase from 'firebase/compat/app';

/**
 * Creates a clean, plain-text summary from a markdown string.
 * @param markdown The markdown content.
 * @param length The maximum length of the summary.
 * @returns A truncated, plain-text summary.
 */
const createSummary = (markdown: string, length: number = 120): string => {
  if (!markdown) return '';
  // Convert markdown to HTML using marked
  const html = marked(markdown) as string;
  // Use the browser's built-in parser to create a document object
  const doc = new DOMParser().parseFromString(html, 'text/html');
  // Extract the text content, which strips all HTML tags
  const plainText = doc.body.textContent || '';
  // Clean up whitespace and normalize line breaks
  const cleanedText = plainText.replace(/\s+/g, ' ').trim();
  // Truncate the text if it's too long
  if (cleanedText.length > length) {
    return cleanedText.substring(0, length) + '...';
  }
  return cleanedText;
};


const App: React.FC = () => {
  const { isAdmin, loading: authLoading } = useAuth();
  const [view, setView] = useState<View>('list');
  const [articles, setArticles] = useState<Article[]>([]);
  const [currentArticle, setCurrentArticle] = useState<Article | null>(null);
  const [keyword, setKeyword] = useState<string>('');
  const [isActionLoading, setIsActionLoading] = useState<boolean>(false);
  const [isListLoading, setIsListLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditingExisting, setIsEditingExisting] = useState<boolean>(false);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const [path, setPath] = useState(window.location.pathname);

  // Pagination state
  const articlesPerPage = 20;
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [pageStartCursors, setPageStartCursors] = useState<Map<number, firebase.firestore.QueryDocumentSnapshot | null>>(new Map([[1, null]]));

  const navigate = useCallback((newPath: string) => {
    if (window.location.pathname !== newPath) {
      window.history.pushState({}, '', newPath);
    }
    setPath(newPath);
    window.scrollTo(0, 0); // Scroll to top on navigation
  }, []);

  // Effect to handle browser back/forward buttons
  useEffect(() => {
    const onPopState = () => {
      setPath(window.location.pathname);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // Effect to fetch total articles count for pagination UI
  useEffect(() => {
    const fetchCount = async () => {
        try {
            const totalArticles = await getArticlesCount();
            setTotalPages(Math.ceil(totalArticles / articlesPerPage) || 1);
        } catch (err) {
            setError(err instanceof Error ? err.message : '記事の総数の取得に失敗しました。');
        }
    };
    fetchCount();
  }, [refetchTrigger]);


  // Effect for fetching articles based on cursor pagination
  useEffect(() => {
    if (view !== 'list') return;

    const fetchArticlesForPage = async () => {
        if (!pageStartCursors.has(currentPage)) {
            setCurrentPage(1);
            return;
        }

        setIsListLoading(true);
        setError(null);
        try {
            const cursor = pageStartCursors.get(currentPage)!;
            const { articles: fetchedArticles, docs } = await getArticles(articlesPerPage, cursor);
            setArticles(fetchedArticles);

            if (docs.length > 0) {
                const nextCursor = docs[docs.length - 1];
                if (!pageStartCursors.has(currentPage + 1)) {
                    setPageStartCursors(prevMap => new Map(prevMap.set(currentPage + 1, nextCursor)));
                }
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : '記事の読み込みに失敗しました。');
        } finally {
            setIsListLoading(false);
        }
    };

    fetchArticlesForPage();
  }, [view, currentPage, refetchTrigger]);

  // Path-based routing logic
  useEffect(() => {
    const handleRouteChange = async () => {
      const pathSegments = path.split('/').filter(Boolean);

      if (path.startsWith('/article/')) {
        const articleId = pathSegments[1];
        if (currentArticle?.id === articleId && view === 'article') return;
        
        setIsListLoading(true);
        try {
          const fetchedArticle = await getArticleById(articleId);
          if (fetchedArticle) {
            setCurrentArticle(fetchedArticle);
            setView('article');
          } else {
            setError('指定された記事が見つかりませんでした。');
            navigate('/');
          }
        } catch (e) {
          setError('記事の読み込みに失敗しました。');
          navigate('/');
        } finally {
          setIsListLoading(false);
        }
      } else if (path.startsWith('/edit/')) {
        const articleId = pathSegments[1];
        if (!isAdmin) {
          navigate('/');
          return;
        }
        if (currentArticle?.id === articleId && view === 'editing') return;

        setIsListLoading(true);
        try {
          const fetchedArticle = await getArticleById(articleId);
          if (fetchedArticle) {
            setCurrentArticle(fetchedArticle);
            setKeyword(fetchedArticle.keyword);
            setIsEditingExisting(true);
            setView('editing');
          } else {
            setError('指定された記事が見つかりませんでした。');
            navigate('/');
          }
        } catch (e) {
          setError('記事の読み込みに失敗しました。');
          navigate('/');
        } finally {
          setIsListLoading(false);
        }
      } else if (path === '/new') {
        if (!isAdmin) {
          navigate('/');
          return;
        }
        setCurrentArticle(null);
        setView('home');
      } else { // Default to list view
        if (view !== 'list') {
            setCurrentArticle(null);
            setView('list');
        }
      }
    };

    handleRouteChange();
  }, [path, isAdmin, navigate]);

  // Effect for setting meta tags for the homepage (list view)
  useEffect(() => {
    const setMetaContent = (selector: string, content: string) => {
      const element = document.querySelector(selector);
      if (element) {
        element.setAttribute('content', content);
      }
    };
    if (view === 'list' || view === 'home') {
      const rootUrl = window.location.origin;
      const siteTitle = 'かしこいママの暮らしノート';
      const siteDescription = '知って得する暮らしのヒントや、育児の裏ワザなど、ママの毎日を応援する情報が満載のブログです。';
      const defaultImageUrl = new URL('/og-image.png', window.location.origin).href;

      document.title = siteTitle;
      setMetaContent('meta[property="og:url"]', rootUrl);
      setMetaContent('meta[name="description"]', siteDescription);
      setMetaContent('meta[property="og:title"]', siteTitle);
      setMetaContent('meta[property="og:description"]', siteDescription);
      setMetaContent('meta[property="og:type"]', 'website');
      setMetaContent('meta[property="og:image"]', defaultImageUrl);
      setMetaContent('meta[property="twitter:title"]', siteTitle);
      setMetaContent('meta[property="twitter:description"]', siteDescription);
      setMetaContent('meta[property="twitter:image"]', defaultImageUrl);
    }
  }, [view]);
  
  // Effect to manage the canonical link tag for SEO
  useEffect(() => {
    const CANONICAL_TAG_ID = 'canonical-link-tag';

    // Clean up any existing canonical tag on change
    const existingLink = document.getElementById(CANONICAL_TAG_ID);
    if (existingLink) {
      existingLink.remove();
    }

    // Only add canonical tags for public, indexable pages
    if (view !== 'list' && view !== 'home' && view !== 'article') {
      return;
    }

    const link = document.createElement('link');
    link.rel = 'canonical';
    link.id = CANONICAL_TAG_ID;
    
    const baseUrl = window.location.origin;

    if (view === 'article' && currentArticle) {
      link.href = `${baseUrl}/article/${currentArticle.id}`;
    } else { // For 'list' or 'home' view
      link.href = baseUrl + '/';
    }

    document.head.appendChild(link);
    
    // Cleanup function to remove the tag when the component unmounts or view changes
    return () => {
      const linkToRemove = document.getElementById(CANONICAL_TAG_ID);
      if (linkToRemove) {
        linkToRemove.remove();
      }
    };
  }, [view, currentArticle]);


  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleGenerate = async (newKeyword: string) => {
    if (!isAdmin) return;
    if (!newKeyword.trim()) {
      setError('キーワードを入力してください。');
      return;
    }
    setKeyword(newKeyword);
    setView('generating');
    setIsActionLoading(true);
    setError(null);
    try {
      const { title, content, sources } = await generateBlogPost(newKeyword);
      const newArticle: Article = {
        id: '',
        _tempId: `temp_${Date.now()}`,
        title,
        content,
        sources,
        keyword: newKeyword,
        createdAt: new Date().toISOString(),
      };
      setCurrentArticle(newArticle);
      setIsEditingExisting(false);
      setView('editing');
    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました。');
      setView('home');
    } finally {
      setIsActionLoading(false);
    }
  };
  
  const handlePublish = async () => {
    if (currentArticle && isAdmin) {
        setIsActionLoading(true);
        setError(null);
        try {
            const articleData = {
                title: currentArticle.title,
                content: currentArticle.content,
                keyword: currentArticle.keyword,
                sources: currentArticle.sources || [],
            };

            if (isEditingExisting) {
                await updateArticle(currentArticle.id, articleData);
            } else {
                await addArticle(articleData);
            }
            setCurrentPage(1);
            setPageStartCursors(new Map([[1, null]]));
            setRefetchTrigger(t => t + 1);
            
            navigate('/');
        } catch (err) {
            setError(err instanceof Error ? err.message : '記事の公開に失敗しました。');
        } finally {
            setIsActionLoading(false);
            setCurrentArticle(null);
            setIsEditingExisting(false);
        }
    }
  };
  
  const handleDelete = async (articleId: string) => {
    if (isAdmin && window.confirm('この記事を本当に削除しますか？この操作は元に戻せません。')) {
      setIsActionLoading(true);
      setError(null);
      try {
        await deleteArticle(articleId);
        setCurrentPage(1);
        setPageStartCursors(new Map([[1, null]]));
        setRefetchTrigger(t => t + 1);

        if (path.includes(articleId)) {
          navigate('/');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '記事の削除に失敗しました。');
      } finally {
        setIsActionLoading(false);
      }
    }
  };
  
  const handlePageChange = (page: number) => {
      if (page >= 1 && page <= totalPages && pageStartCursors.has(page)) {
          setCurrentPage(page);
          window.scrollTo(0, 0);
      }
  };

  const handleSelectArticle = (article: Article) => {
    navigate(`/article/${article.id}`);
  };

  const handleEditArticle = (article: Article) => {
    if (!isAdmin) return;
    navigate(`/edit/${article.id}`);
  };
  
  const handleBackFromEditor = () => {
      const previousArticleId = currentArticle?.id;
      setCurrentArticle(null);
      if (isEditingExisting && previousArticleId) {
          navigate(`/article/${previousArticleId}`);
      } else {
          navigate('/new');
      }
      setIsEditingExisting(false);
  };


  const renderContent = () => {
    if (authLoading || (isListLoading && view !== 'editing')) {
      return (
        <div className="flex justify-center items-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-rose-500"></div>
            <span className="ml-4 text-gray-600">{authLoading ? '認証情報を読み込んでいます...' : '記事を読み込んでいます...'}</span>
        </div>
      )
    }

    switch (view) {
      case 'generating':
        return isAdmin ? <LoadingScreen keyword={keyword} /> : null;
      case 'editing':
        return isAdmin && currentArticle ? <ArticleEditor key={currentArticle.id || currentArticle._tempId} article={currentArticle} setArticle={setCurrentArticle} onPublish={handlePublish} onRegenerate={() => handleGenerate(keyword)} onBack={handleBackFromEditor} isNewArticle={!isEditingExisting} isLoading={isActionLoading} /> : null;
      case 'list':
        return <ArticleList articles={articles} onSelectArticle={handleSelectArticle} onDeleteArticle={isAdmin ? handleDelete : undefined} isLoading={isListLoading} currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} hasNextPage={pageStartCursors.has(currentPage + 1) || articles.length === articlesPerPage} />;
      case 'article':
        return currentArticle ? <ArticleDetail article={currentArticle} onBack={() => navigate('/')} onEdit={isAdmin ? () => handleEditArticle(currentArticle) : undefined} onDelete={isAdmin ? () => handleDelete(currentArticle.id) : undefined} /> : null;
      case 'home':
      default:
        if (!isAdmin) {
           return <ArticleList articles={articles} onSelectArticle={handleSelectArticle} onDeleteArticle={undefined} isLoading={isListLoading} currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} hasNextPage={pageStartCursors.has(currentPage + 1) || articles.length === articlesPerPage} />;
        }
        return <KeywordForm onGenerate={handleGenerate} isLoading={isActionLoading} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header navigate={navigate} />
      <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <strong className="font-bold">エラー: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        {renderContent()}
      </main>
      <Footer />
    </div>
  );
};

const KeywordForm: React.FC<{ onGenerate: (keyword: string) => void; isLoading: boolean; }> = ({ onGenerate, isLoading }) => {
  const [localKeyword, setLocalKeyword] = useState('');
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate(localKeyword);
  };
  return (
    <div className="max-w-2xl mx-auto text-center py-16">
      <SparklesIcon className="w-16 h-16 mx-auto text-rose-500" />
      <h2 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">ブログ記事を自動生成</h2>
      <p className="mt-4 text-lg text-gray-600">キーワードを入力するだけで、AIがSEOに最適化されたアフィリエイト記事を作成します。</p>
      <form onSubmit={handleSubmit} className="mt-10 flex flex-col sm:flex-row gap-4 items-center justify-center">
        <input
          type="text"
          value={localKeyword}
          onChange={(e) => setLocalKeyword(e.target.value)}
          placeholder="例：「プロテイン おすすめ 初心者」"
          className="w-full sm:w-96 px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-rose-500 focus:border-rose-500 text-lg"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading}
          className="w-full sm:w-auto flex items-center justify-center px-8 py-3 border border-transparent text-lg font-medium rounded-md shadow-sm text-white bg-rose-500 hover:bg-rose-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 disabled:bg-rose-300 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? '生成中...' : '記事を生成'}
          {!isLoading && <SparklesIcon className="ml-2 h-5 w-5" />}
        </button>
      </form>
    </div>
  );
};

const LoadingScreen: React.FC<{ keyword: string }> = ({ keyword }) => (
  <div className="flex flex-col items-center justify-center text-center h-full py-16">
    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-rose-500"></div>
    <h3 className="mt-6 text-2xl font-semibold">AIが記事を執筆中...</h3>
    <p className="mt-2 text-gray-600">キーワード: 「{keyword}」</p>
    <p className="mt-1 text-gray-500">高品質な記事を生成しています。1分ほどお待ちください。</p>
  </div>
);

const ArticleEditor: React.FC<{
  article: Article;
  setArticle: React.Dispatch<React.SetStateAction<Article | null>>;
  onPublish: () => void;
  onRegenerate: () => void;
  onBack: () => void;
  isNewArticle: boolean;
  isLoading: boolean;
}> = ({ article, setArticle, onPublish, onRegenerate, onBack, isNewArticle, isLoading }) => {
    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => setArticle(prev => prev ? { ...prev, title: e.target.value } : null);
    const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => setArticle(prev => prev ? { ...prev, content: e.target.value } : null);
    
    const [sourcesMarkdown, setSourcesMarkdown] = useState(() => {
      // This initializer function runs only once when the component mounts (or the key changes),
      // correctly setting the initial state from the article prop without causing re-render issues.
      // This solves both the input-reset bug and the new-article-sources-not-showing bug.
      return article.sources ? article.sources.map(s => `[${s.title}](${s.uri})`).join('\n') : '';
    });

    const handleSourcesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const text = e.target.value;
        // First, update the local state to immediately reflect user input in the textarea.
        setSourcesMarkdown(text);

        // Then, parse the text and update the parent component's state.
        // This ensures the main article data is always up-to-date for publishing.
        const lines = text.split('\n').filter(line => line.trim() !== '');
        const newSources: Source[] = lines.map(line => {
            const match = line.match(/\[(.*?)]\((.*?)\)/);
            if (match && match[1] && match[2]) {
                return { title: match[1].trim(), uri: match[2].trim() };
            }
            return null;
        }).filter((s): s is Source => s !== null);
        
        setArticle(prev => prev ? { ...prev, sources: newSources } : null);
    };

    return (
    <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-4">{isNewArticle ? '生成された記事の確認・編集' : '記事の編集'}</h2>
        <div className="space-y-6">
            <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">タイトル</label>
                <input id="title" type="text" value={article.title} onChange={handleTitleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-rose-500 focus:border-rose-500 sm:text-sm" />
            </div>
            <div>
                <label htmlFor="content" className="block text-sm font-medium text-gray-700">本文</label>
                <textarea id="content" value={article.content} onChange={handleContentChange} rows={20} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-rose-500 focus:border-rose-500 sm:text-sm whitespace-pre-wrap" />
            </div>
            <div>
                <label htmlFor="sources" className="block text-sm font-medium text-gray-700">参考にしたサイト</label>
                <p className="text-xs text-gray-500 mb-1">各行に `[タイトル](URL)` の形式で入力してください。</p>
                <textarea 
                  id="sources" 
                  value={sourcesMarkdown} 
                  onChange={handleSourcesChange} 
                  rows={5} 
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-rose-500 focus:border-rose-500 sm:text-sm whitespace-pre-wrap font-mono"
                  placeholder="[Google](https://www.google.com)&#10;[スマートニュース](https://www.smartnews.com/)"
                />
            </div>
        </div>
        <div className="mt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
             <button onClick={onBack} className="flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-stone-500 w-full sm:w-auto">
                <BackIcon className="mr-2 h-4 w-4" />
                戻る
            </button>
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                 <button onClick={onRegenerate} disabled={isLoading} className="flex items-center justify-center px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-rose-700 bg-rose-100 hover:bg-rose-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 w-full disabled:bg-rose-50 disabled:cursor-not-allowed">
                    <RegenerateIcon className="mr-2 h-4 w-4" />
                    再生成
                </button>
                <button onClick={onPublish} disabled={isLoading} className="flex items-center justify-center px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-rose-500 hover:bg-rose-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 w-full disabled:bg-rose-300 disabled:cursor-not-allowed">
                    <PublishIcon className="mr-2 h-4 w-4" />
                    {isLoading ? '処理中...' : (isNewArticle ? 'この記事を公開する' : '変更を保存')}
                </button>
            </div>
        </div>
    </div>
)};

const Pagination: React.FC<{
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  hasNextPage: boolean;
}> = ({ currentPage, totalPages, onPageChange, hasNextPage }) => {

  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav aria-label="記事のページネーション" className="flex justify-center items-center gap-4 mt-10">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-4 py-2 text-sm font-medium text-stone-600 bg-white rounded-md shadow-sm border border-stone-200 hover:bg-stone-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        前へ
      </button>
      
      <span className="text-sm text-stone-600">
        {totalPages > 0 ? `${currentPage} / ${totalPages}` : '0 / 0'} ページ
      </span>
      
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages || !hasNextPage}
        className="px-4 py-2 text-sm font-medium text-stone-600 bg-white rounded-md shadow-sm border border-stone-200 hover:bg-stone-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        次へ
      </button>
    </nav>
  );
};


const ArticleList: React.FC<{
  articles: Article[];
  onSelectArticle: (article: Article) => void;
  onDeleteArticle?: (id: string) => void;
  isLoading: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  hasNextPage: boolean;
}> = ({ articles, onSelectArticle, onDeleteArticle, isLoading, currentPage, totalPages, onPageChange, hasNextPage }) => (
  <div className="max-w-4xl mx-auto">
     <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <h2 className="text-3xl font-bold text-rose-500">
          みんなの記事一覧
        </h2>
        <ShareButtons url={window.location.origin} title="かしこいママの暮らしノート｜知って得する暮らしのヒント" />
      </div>
    {isLoading && articles.length === 0 ? (
        <div className="flex justify-center items-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-rose-500"></div>
        </div>
    ) : articles.length === 0 ? (
      <div className="text-center py-16 px-6 bg-white rounded-2xl shadow-md border-2 border-dashed border-rose-200">
        <HeartIcon className="w-16 h-16 mx-auto text-rose-300" />
        <h3 className="mt-4 text-2xl font-semibold text-stone-700">まだ記事がありません♪</h3>
        <p className="mt-2 text-stone-500">管理者の方は「新規作成」から、最初の記事を投稿してみましょう！</p>
      </div>
    ) : (
      <>
        <div className="space-y-8">
          {articles.map(article => (
            <div key={article.id} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden group relative">
                <a href={`/article/${article.id}`} onClick={(e) => { e.preventDefault(); onSelectArticle(article); }} className="cursor-pointer block md:flex">
                    <div className="md:w-1/3 md:flex-shrink-0 overflow-hidden">
                        {article.thumbnailUrl ? (
                            <img src={article.thumbnailUrl} alt={article.title} className="h-48 w-full object-cover md:h-full transition-transform duration-300 group-hover:scale-105" />
                        ) : (
                            <img src="/og-image.png" alt="かしこいママの暮らしノート" className="h-48 w-full object-cover md:h-full" />
                        )}
                    </div>
                    <div className="p-6 flex flex-col flex-grow">
                        <h3 className="text-xl font-bold text-rose-600 group-hover:text-rose-700 transition-colors break-words">{article.title}</h3>
                        <p className="mt-2 text-stone-600 line-clamp-3 flex-grow">{createSummary(article.content)}</p>
                        <div className="mt-4 flex items-center gap-3">
                            <span className="bg-rose-100 text-rose-700 px-3 py-1 rounded-full text-xs font-semibold">{article.keyword}</span>
                            <span className="text-stone-400 text-xs">{new Date(article.createdAt).toLocaleDateString('ja-JP')}</span>
                        </div>
                    </div>
                </a>
                {onDeleteArticle && (
                    <div className="absolute top-4 right-4">
                        <button onClick={(e) => { e.stopPropagation(); onDeleteArticle(article.id); }} className="p-2 text-stone-400 hover:text-rose-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity bg-white/50 hover:bg-white" aria-label="記事を削除">
                            <TrashIcon className="h-5 w-5" />
                        </button>
                    </div>
                )}
            </div>
          ))}
        </div>
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={onPageChange} hasNextPage={hasNextPage} />
      </>
    )}
    <AffiliateAd />
  </div>
);

const ArticleDetail: React.FC<{
  article: Article;
  onBack: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}> = ({ article, onBack, onEdit, onDelete }) => {
  const sanitizedHtml = DOMPurify.sanitize(marked(article.content) as string);
  
  useEffect(() => {
    const setMetaContent = (selector: string, content: string): [Element | null, string | null] => {
      const element = document.querySelector(selector);
      const originalContent = element ? element.getAttribute('content') : null;
      if (element) {
        element.setAttribute('content', content);
      }
      return [element, originalContent];
    };

    const getFirstImageUrlFromMarkdown = (markdown: string): string => {
        const html = marked(markdown) as string;
        const match = html.match(/<img[^>]+src="([^">]+)"/);
        if (match && match[1]) {
            return new URL(match[1], window.location.origin).href;
        }
        return new URL('/og-image.png', window.location.origin).href;
    };

    const originalTitle = document.title;
    const pageTitle = `${article.title} | かしこいママの暮らしノート`;
    document.title = pageTitle;

    const description = article.content.substring(0, 120).replace(/\s+/g, ' ').trim() + '...';
    const pageUrl = window.location.href;
    const imageUrl = getFirstImageUrlFromMarkdown(article.content);

    const originalValues: [Element | null, string | null][] = [
      setMetaContent('meta[name="description"]', description),
      setMetaContent('meta[property="og:title"]', pageTitle),
      setMetaContent('meta[property="og:description"]', description),
      setMetaContent('meta[property="og:type"]', 'article'),
      setMetaContent('meta[property="og:url"]', pageUrl),
      setMetaContent('meta[property="og:image"]', imageUrl),
      setMetaContent('meta[property="twitter:title"]', pageTitle),
      setMetaContent('meta[property="twitter:description"]', description),
      setMetaContent('meta[property="twitter:image"]', imageUrl),
    ];
    
    return () => {
      document.title = originalTitle;
      originalValues.forEach(([element, originalContent]) => {
        if (element && originalContent !== null) {
          element.setAttribute('content', originalContent);
        }
      });
    };
  }, [article]);

  return (
    <div className="max-w-4xl mx-auto bg-white p-6 sm:p-10 rounded-2xl shadow-xl">
      <div className="flex flex-col sm:flex-row justify-between items-start mb-6 gap-4">
        <button onClick={onBack} className="flex-shrink-0 flex items-center px-4 py-2 text-sm font-medium text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors">
          <BackIcon className="mr-2 h-4 w-4" />
          記事一覧に戻る
        </button>
        <div className="flex flex-row gap-2 self-end sm:self-auto">
            {onEdit && (
              <button onClick={onEdit} className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-rose-500 hover:bg-rose-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500">
                <EditIcon className="mr-2 h-4 w-4" />
                編集する
              </button>
            )}
            {onDelete && (
              <button onClick={onDelete} className="flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg shadow-sm text-white bg-stone-600 hover:bg-stone-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-stone-500">
                <TrashIcon className="mr-2 h-4 w-4" />
                削除
              </button>
            )}
        </div>
      </div>
      <article>
        <h1 className="mt-4 text-3xl sm:text-4xl font-extrabold text-rose-600 leading-tight">{article.title}</h1>
        <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-rose-100 pb-4">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
               <span className="flex items-center gap-1.5 bg-rose-100 text-rose-800 px-3 py-1 rounded-full text-sm font-semibold">
                 <TagIcon className="h-4 w-4" />
                 {article.keyword}
               </span> 
              <span className="flex items-center gap-1.5 text-stone-500 text-sm">
                <CalendarIcon className="h-4 w-4" />
                {new Date(article.createdAt).toLocaleDateString('ja-JP')}
              </span>
            </div>
            <ShareButtons url={window.location.href} title={article.title} />
        </div>
        
        <div
          className="prose prose-rose max-w-none mt-8 text-lg text-stone-700 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
        />
      </article>

      {article.sources && article.sources.length > 0 && (
        <section className="mt-12 pt-8 border-t border-rose-200">
          <h2 className="text-xl font-bold text-stone-700 mb-4">参考にしたサイト</h2>
          <ul className="space-y-3">
            {article.sources.map((source: Source, index: number) => (
              <li key={index} className="flex items-start">
                <ExternalLinkIcon className="flex-shrink-0 h-5 w-5 text-rose-400 mt-1 mr-3" />
                <a 
                  href={source.uri} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-rose-600 hover:underline hover:text-rose-700 transition-colors break-all"
                >
                  {source.title}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      <AffiliateAd />
    </div>
  );
};

export default App;