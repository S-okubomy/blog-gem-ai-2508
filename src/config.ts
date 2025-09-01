// =================================================================================
// アプリケーション設定ファイル
// =================================================================================
// このファイルは、ビルド時に環境変数から設定を読み込みます。
// Cloud Runへのデプロイでは、Cloud Buildがこれらの値を安全に注入します。
//
// !!! 重要 !!!
// ローカル開発を行うには、プロジェクトのルートディレクトリに
// `.env` という名前のファイルを作成し、そこにあなたのAPIキーとFirebase設定を
// 記述する必要があります。
//
// `.env` ファイルの内容例：
// ---------------------------------------------------------------------------------
// # Gemini API Key (サーバーサイドでのみ使用)
// API_KEY="YOUR_GEMINI_API_KEY_HERE"
//
// # Firebase Configuration (クライアントサイドのビルド時に使用)
// FIREBASE_API_KEY="YOUR_FIREBASE_API_KEY_HERE"
// FIREBASE_AUTH_DOMAIN="YOUR_FIREBASE_AUTH_DOMAIN_HERE"
// FIREBASE_PROJECT_ID="YOUR_FIREBASE_PROJECT_ID_HERE"
// FIREBASE_STORAGE_BUCKET="YOUR_FIREBASE_STORAGE_BUCKET_HERE"
// FIREBASE_MESSAGING_SENDER_ID="YOUR_FIREBASE_MESSAGING_SENDER_ID_HERE"
// FIREBASE_APP_ID="YOUR_FIREBASE_APP_ID_HERE"
//
// # Admin User Email (クライアントサイドのビルド時に使用)
// ADMIN_EMAIL="your.admin.email@example.com"
// ---------------------------------------------------------------------------------
//
// `.env` ファイルは絶対にGitリポジトリにコミットしないでください。
// =================================================================================


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