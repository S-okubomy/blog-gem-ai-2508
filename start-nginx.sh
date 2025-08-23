#!/bin/sh

# このスクリプトは、コンテナ起動時にCloud Runから提供される
# PORT環境変数を使ってNginxの設定を動的に生成し、サーバーを起動します。

# Nginx設定テンプレートから最終的な設定ファイルを生成
# envsubstコマンドは、'${PORT}'のような変数を環境変数の値で置換します
envsubst '${PORT}' < /etc/nginx/nginx.conf.template > /etc/nginx/conf.d/default.conf

# Nginxをフォアグラウンドで起動
# これによりコンテナが実行し続けます
exec nginx -g 'daemon off;'