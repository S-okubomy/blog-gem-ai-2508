# ==============================================================================
# ステージ1: ビルド環境 (Node.js)
# ==============================================================================
# 安定したLTSバージョンのNode.jsイメージをベースにします
FROM node:24-alpine AS build

# アプリケーションの作業ディレクトリを設定
WORKDIR /app

# package.jsonとpackage-lock.json (またはyarn.lock) をコピー
COPY package*.json ./

# 依存関係をインストール
# CI=trueを指定することで、警告をエラーとして扱わず、インタラクティブなプロンプトを無効にします
RUN npm install --ci

# アプリケーションのソースコードをすべてコピー
COPY . .

# --- ここからが本番環境用の環境変数設定です ---

# Cloud Buildから渡されるビルド引数を定義します
ARG API_KEY
ARG FIREBASE_API_KEY
ARG FIREBASE_AUTH_DOMAIN
ARG FIREBASE_PROJECT_ID
ARG FIREBASE_STORAGE_BUCKET
ARG FIREBASE_MESSAGING_SENDER_ID
ARG FIREBASE_APP_ID
ARG ADMIN_EMAIL

# ビルド引数を使って、コンテナ内に .env ファイルを生成します
# これにより、Viteがビルド時にこれらの値を読み込みます
RUN echo "API_KEY=${API_KEY}" > .env
RUN echo "FIREBASE_API_KEY=${FIREBASE_API_KEY}" >> .env
RUN echo "FIREBASE_AUTH_DOMAIN=${FIREBASE_AUTH_DOMAIN}" >> .env
RUN echo "FIREBASE_PROJECT_ID=${FIREBASE_PROJECT_ID}" >> .env
RUN echo "FIREBASE_STORAGE_BUCKET=${FIREBASE_STORAGE_BUCKET}" >> .env
RUN echo "FIREBASE_MESSAGING_SENDER_ID=${FIREBASE_MESSAGING_SENDER_ID}" >> .env
RUN echo "FIREBASE_APP_ID=${FIREBASE_APP_ID}" >> .env
RUN echo "ADMIN_EMAIL=${ADMIN_EMAIL}" >> .env

# アプリケーションを本番用にビルド
# これにより `dist` フォルダが生成されます
RUN npm run build

# ==============================================================================
# ステージ2: 本番環境 (Nginx)
# ==============================================================================
# 軽量なWebサーバーであるNginxの公式イメージをベースにします
FROM nginx:1.28-alpine

# Cloud RunのPORT環境変数に対応するために必要なツール(gettext)と、改行コード変換ツール(dos2unix)をインストール
# gettextパッケージにはenvsubstコマンドが含まれています
RUN apk update && apk add --no-cache gettext dos2unix

# Nginx設定テンプレートと起動スクリプトをコピー
COPY nginx.conf.template /etc/nginx/
COPY start-nginx.sh /usr/local/bin/

# 起動スクリプトの改行コードをWindows形式(CRLF)からUnix形式(LF)に変換
RUN dos2unix /usr/local/bin/start-nginx.sh

# 起動スクリプトに実行権限を付与
RUN chmod +x /usr/local/bin/start-nginx.sh

# ビルドステージで生成された静的ファイルをNginxの配信フォルダにコピー
COPY --from=build /app/dist /usr/share/nginx/html

# Cloud RunはコンテナにPORT環境変数を渡します。
# start-nginx.shスクリプトが正しいポートでリッスンするように設定を動的に生成します。
EXPOSE 8080

# コンテナが起動したときにカスタムスクリプトを実行
CMD ["/usr/local/bin/start-nginx.sh"]