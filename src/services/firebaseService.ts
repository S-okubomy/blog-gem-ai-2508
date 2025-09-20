import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import 'firebase/compat/auth';
import type { Article } from '../types';
import { firebaseConfig } from '../config';
// Modular SDK imports for features not in compat
import { getFirestore, collection, getCountFromServer } from 'firebase/firestore';


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

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
export const auth = firebase.auth();
const modularDb = getFirestore(app); // Get modular instance from compat app

const articlesCollectionRef = db.collection('articles');
const Timestamp = firebase.firestore.Timestamp;

// Data type for adding/updating articles in Firestore
type ArticleData = Omit<Article, 'id' | 'createdAt'>;
type ArticleUpdateData = Partial<Omit<Article, 'id' | 'createdAt'>>;


export const getArticlesCount = async (): Promise<number> => {
  try {
    const modularArticlesCollection = collection(modularDb, 'articles');
    const snapshot = await getCountFromServer(modularArticlesCollection);
    return snapshot.data().count;
  } catch (error) {
    console.error("Error getting articles count: ", error);
    throw new Error("記事の総数の取得に失敗しました。");
  }
};


export const getArticles = async (
  pageSize: number,
  startAfterDoc: firebase.firestore.QueryDocumentSnapshot | null
): Promise<{ articles: Article[], docs: firebase.firestore.QueryDocumentSnapshot[] }> => {
  try {
    let query = articlesCollectionRef
      .orderBy('createdAt', 'desc')
      .orderBy(firebase.firestore.FieldPath.documentId(), 'desc');

    if (startAfterDoc) {
      query = query.startAfter(startAfterDoc);
    }
    
    const snapshot = await query.limit(pageSize).get();
    const docs = snapshot.docs;
    const articles = docs.map(doc => {
      const data = doc.data();
      const createdAt = data.createdAt instanceof Timestamp
        ? data.createdAt.toDate().toISOString()
        : new Date().toISOString();
      return { ...data, id: doc.id, createdAt } as Article;
    });

    return { articles, docs };
  } catch (error) {
    console.error("Error fetching articles: ", error);
    throw new Error("記事の読み込みに失敗しました。Firebaseのセキュリティルールが正しく設定されているか確認してください。");
  }
};


export const getArticleById = async (id: string): Promise<Article | null> => {
  try {
    const docRef = articlesCollectionRef.doc(id);
    const docSnap = await docRef.get();
    if (docSnap.exists) {
      const data = docSnap.data()!;
      const createdAt = data.createdAt instanceof Timestamp
        ? data.createdAt.toDate().toISOString()
        : new Date().toISOString();
      return { ...data, id: docSnap.id, createdAt } as Article;
    } else {
      console.warn(`Article with id ${id} not found.`);
      return null;
    }
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
