// =================================================================================
// アプリケーション設定ファイル
// =================================================================================
// このファイルは、環境変数(.env)から設定を読み込みます。
//
// !!! 重要 !!!
// このアプリケーションを動作させるには、プロジェクトのルートディレクトリに
// `.env` という名前のファイルを作成し、そこにあなたのAPIキーとFirebase設定を
// 記述する必要があります。
//
// `.env` ファイルの内容例：
// ---------------------------------------------------------------------------------
// # Gemini API Key (https://aistudio.google.com/app/apikey から取得)
// API_KEY="YOUR_GEMINI_API_KEY_HERE"
//
// # Firebase Configuration (Firebaseコンソールのプロジェクト設定から取得)
// FIREBASE_API_KEY="YOUR_FIREBASE_API_KEY_HERE"
// FIREBASE_AUTH_DOMAIN="YOUR_FIREBASE_AUTH_DOMAIN_HERE"
// FIREBASE_PROJECT_ID="YOUR_FIREBASE_PROJECT_ID_HERE"
// FIREBASE_STORAGE_BUCKET="YOUR_FIREBASE_STORAGE_BUCKET_HERE"
// FIREBASE_MESSAGING_SENDER_ID="YOUR_FIREBASE_MESSAGING_SENDER_ID_HERE"
// FIREBASE_APP_ID="YOUR_FIREBASE_APP_ID_HERE"
//
// # Admin User Email
// ADMIN_EMAIL="your.admin.email@example.com"
// ---------------------------------------------------------------------------------
//
// `.env` ファイルは絶対にGitリポジトリにコミットしないでください。
// このプロジェクトには `.gitignore` が含まれており、`.env` ファイルが
// 誤ってコミットされるのを防ぎます。
// =================================================================================


// ---------------------------------------------------------------------------------
// Gemini APIキー
// ---------------------------------------------------------------------------------
export const API_KEY = process.env.API_KEY;


// ---------------------------------------------------------------------------------
// Firebase プロジェクト設定
// ---------------------------------------------------------------------------------
export const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
};

// ---------------------------------------------------------------------------------
// 管理者ユーザーのメールアドレス
// ---------------------------------------------------------------------------------
export const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
