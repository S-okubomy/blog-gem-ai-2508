import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import 'firebase/compat/auth';
import type { Article } from '../types';
import { firebaseConfig } from '../config';

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
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
export const auth = firebase.auth();

const articlesCollectionRef = db.collection('articles');
const Timestamp = firebase.firestore.Timestamp;

// Data type for adding/updating articles in Firestore
type ArticleData = Omit<Article, 'id' | 'createdAt'>;
type ArticleUpdateData = Omit<Article, 'id' | 'createdAt' | 'content'> & { content?: string };


export const getArticles = async (): Promise<Article[]> => {
  try {
    const q = articlesCollectionRef.orderBy('createdAt', 'desc');
    const snapshot = await q.get();
    return snapshot.docs.map(doc => {
      const data = doc.data();
      // Convert Firestore Timestamp to ISO string for consistency in the app
      const createdAt = data.createdAt instanceof Timestamp
        ? data.createdAt.toDate().toISOString()
        : new Date().toISOString();
      return { ...data, id: doc.id, createdAt } as Article;
    });
  } catch (error) {
    console.error("Error fetching articles: ", error);
    throw new Error("記事の読み込みに失敗しました。Firebaseのセキュリティルールが正しく設定されているか確認してください。");
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

export const updateArticle = async (id: string, data: Partial<ArticleUpdateData>): Promise<void> => {
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
    const articleDoc = articlesCollectionRef.doc(id);
    await articleDoc.delete();
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