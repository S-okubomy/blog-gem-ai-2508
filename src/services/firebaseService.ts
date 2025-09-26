import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import 'firebase/compat/auth';
import type { Article } from '../types';
import { firebaseConfig } from '../config';
import { marked } from 'marked';


// 環境変数が設定されているか確認します
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  const errorMessage = "Firebaseの設定が完了していません。プロジェクトルートに .env ファイルを作成し、Firebaseの各設定値（FIREBASE_API_KEYなど）を記述してください。";
    // アプリケーションがクラッシュするのを防ぎ、ユーザーにエラーメッセージを表示します。
  document.body.innerHTML = `<div style="font-family: sans-serif; padding: 2rem; color: #b91c1c; background-color: #fee2e2; border: 1px solid #f87171; border-radius: 0.5rem; margin: 2rem;">
    <h1 style="font-size: 1.5rem; font-weight: bold;">設定エラー</h1>
    <p>${errorMessage}</p>
    <p>.env ファイルにFirebaseコンソールから取得した値を設定した後、アプリケーションをリロードしてください。</p>
  </div>`;
  throw new Error(errorMessage);
}

// Initialize Firebase for client-side auth
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
export const auth = firebase.auth();

const articlesCollectionRef = db.collection('articles');
const Timestamp = firebase.firestore.Timestamp;

// Data type for adding/updating articles in Firestore
type ArticleData = Omit<Article, 'id' | 'createdAt'>;
type ArticleUpdateData = Partial<Omit<Article, 'id' | 'createdAt'>>;

/**
 * Extracts the URL of the first image from a markdown string.
 * @param markdown The markdown content of the article.
 * @returns The URL of the first image, or null if no image is found.
 */
const extractFirstImageUrl = (markdown: string): string | null => {
  if (!markdown) return null;
  // Use a non-greedy regex to find the first markdown image: ![alt](src)
  const match = markdown.match(/!\[.*?\]\((.*?)\)/);
  if (match && match[1]) {
    return match[1];
  }
  // Fallback for HTML img tags if markdown contains raw HTML
  const htmlMatch = markdown.match(/<img[^>]+src="([^">]+)"/);
  return htmlMatch ? htmlMatch[1] : null;
};

// Helper function to handle API fetch responses
const handleApiResponse = async (response: Response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'サーバーから不明なエラーが返されました。' }));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }
  return response.json();
};

export const getArticlesCount = async (): Promise<number> => {
  try {
    const response = await fetch('/api/articles-count');
    const data = await handleApiResponse(response);
    return data.count;
  } catch (error) {
    console.error("Error getting articles count: ", error);
    throw new Error("記事の総数の取得に失敗しました。");
  }
};


export const getArticles = async (
  pageSize: number,
  startAfterDocId: string | null
): Promise<{ articles: Article[], lastDocId: string | null }> => {
  try {
    const params = new URLSearchParams({ pageSize: String(pageSize) });
    if (startAfterDocId) {
      params.append('startAfter', startAfterDocId);
    }
    const response = await fetch(`/api/articles?${params.toString()}`);
    const data = await handleApiResponse(response);
    
    const articlesWithThumbnails = data.articles.map((article: Article) => ({
      ...article,
      thumbnailUrl: extractFirstImageUrl(article.content || '')
    }));
    
    return { articles: articlesWithThumbnails, lastDocId: data.lastDocId };
  } catch (error) {
    console.error("Error fetching articles: ", error);
    throw new Error("記事の読み込みに失敗しました。サーバーが正しく動作しているか確認してください。");
  }
};


export const getArticleById = async (id: string): Promise<Article | null> => {
  try {
    const response = await fetch(`/api/articles/${id}`);
    if (response.status === 404) {
        console.warn(`Article with id ${id} not found.`);
        return null;
    }
    const data = await handleApiResponse(response);
    data.thumbnailUrl = extractFirstImageUrl(data.content || '');
    return data as Article;
  } catch (error) {
    console.error(`Error fetching article by ID ${id}:`, error);
    throw new Error("指定された記事の読み込みに失敗しました。");
  }
};


export const addArticle = async (data: Omit<ArticleData, 'createdAt'>): Promise<string> => {
  try {
    const docRef = await articlesCollectionRef.add({
      ...data,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding article: ", error);
    throw new Error("記事の保存に失敗しました。");
  }
};

export const updateArticle = async (id: string, data: ArticleUpdateData): Promise<void> => {
  try {
    const articleDoc = articlesCollectionRef.doc(id);
    await articleDoc.update(data);
  } catch (error) {
    console.error("Error updating article: ", error);
    throw new Error("記事の更新に失敗しました。");
  }
};

export const deleteArticle = async (id: string): Promise<void> => {
  try {
    await articlesCollectionRef.doc(id).delete();
  } catch (error) {
    console.error("Error deleting article: ", error);
    throw new Error("記事の削除に失敗しました。");
  }
};

// --- Authentication Functions ---

export const signInWithGoogle = async () => {
  const provider = new firebase.auth.GoogleAuthProvider();
  try {
    await auth.signInWithPopup(provider);
  } catch (error) {
    console.error("Error signing in with Google: ", error);
    throw new Error("Googleログインに失敗しました。");
  }
};

export const signOutUser = async () => {
  try {
    await auth.signOut();
  } catch (error) {
    console.error("Error signing out: ", error);
    throw new Error("ログアウトに失敗しました。");
  }
};

export const getAllArticlesForSitemap = async (): Promise<{ id: string, createdAt: string }[]> => {
  try {
    const snapshot = await articlesCollectionRef.orderBy('createdAt', 'desc').get();
    return snapshot.docs.map(doc => {
      const data = doc.data();
      const createdAt = data.createdAt instanceof Timestamp
        ? data.createdAt.toDate().toISOString()
        : new Date().toISOString();
      return { id: doc.id, createdAt };
    });
  } catch (error) {
    console.error("Error fetching all articles for sitemap: ", error);
    throw new Error("全記事の取得に失敗しました。");
  }
};