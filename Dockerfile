# ===== ビルドステージ (Builder Stage) =====
# 安定したLTSバージョンのNode.jsイメージをベースにします
FROM node:24-alpine AS builder

# 作業ディレクトリを設定
WORKDIR /app

# まずは依存関係ファイルのみコピーして、キャッシュを有効活用
COPY package*.json ./
# 依存関係をインストール (devDependenciesも含む)
RUN npm install

# アプリケーションのソースコードをすべてコピー
COPY . .

# ビルド時に外部から渡される引数を定義します (cloudbuild.yamlから渡されます)
ARG FIREBASE_API_KEY
ARG FIREBASE_AUTH_DOMAIN
ARG FIREBASE_PROJECT_ID
ARG FIREBASE_STORAGE_BUCKET
ARG FIREBASE_MESSAGING_SENDER_ID
ARG FIREBASE_APP_ID
ARG ADMIN_EMAIL

# ビルド引数を使って、コンテナ内に .env ファイルを生成します。
# これにより、Viteがビルド時にこれらの値を読み込むことができます。
# ★★★ 重要 ★★★: ここにはサーバーサイド専用のAPI_KEYは含めません。
RUN echo "FIREBASE_API_KEY=${FIREBASE_API_KEY}" > .env
RUN echo "FIREBASE_AUTH_DOMAIN=${FIREBASE_AUTH_DOMAIN}" >> .env
RUN echo "FIREBASE_PROJECT_ID=${FIREBASE_PROJECT_ID}" >> .env
RUN echo "FIREBASE_STORAGE_BUCKET=${FIREBASE_STORAGE_BUCKET}" >> .env
RUN echo "FIREBASE_MESSAGING_SENDER_ID=${FIREBASE_MESSAGING_SENDER_ID}" >> .env
RUN echo "FIREBASE_APP_ID=${FIREBASE_APP_ID}" >> .env
RUN echo "ADMIN_EMAIL=${ADMIN_EMAIL}" >> .env

# フロントエンドとサーバーサイドをビルド
RUN npm run build


# ===== プロダクションステージ (Production Stage) =====
# 安定したLTSバージョンのNode.jsイメージをベースにします
FROM node:24-alpine

WORKDIR /app

# ビルダーからビルド済みファイルと本番用の依存関係のみをコピー
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/dist-server ./dist-server
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Cloud Runがリッスンするポート番号 (8080) を公開
EXPOSE 8080
ENV PORT=8080

# アプリケーションを起動
# `npm start` は `node dist-server/server.js` を実行します
CMD ["npm", "start"]