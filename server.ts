import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import 'dotenv/config';
import admin from 'firebase-admin';

// Initialize Firebase Admin SDK
// This uses Application Default Credentials. For local development,
// ensure you've authenticated via `gcloud auth application-default login`
// or have the GOOGLE_APPLICATION_CREDENTIALS environment variable set.
try {
  if (!admin.apps.length) {
    admin.initializeApp();
  }
} catch (error) {
  console.error("Firebase Admin initialization failed:", error);
  process.exit(1);
}
const db = admin.firestore();

const app = express();
const port = process.env.PORT || 8080;

// ESM-friendly __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

(app.use as any)(express.json());

// Sitemap cache variables
let sitemapCache: string | null = null;
let cacheTimestamp: number | null = null;
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour cache

// Sitemap generation route
app.get('/sitemap.xml', async (req, res) => {
    const now = Date.now();
    // Serve from cache if it's not expired
    if (sitemapCache && cacheTimestamp && (now - cacheTimestamp < CACHE_DURATION_MS)) {
        res.header('Content-Type', 'application/xml');
        return res.send(sitemapCache);
    }

    try {
        // Optimization: Select only the 'createdAt' field to reduce data transfer.
        const articlesSnapshot = await db.collection('articles')
            .orderBy('createdAt', 'desc')
            .select('createdAt')
            .get();
        
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        let xml = `<?xml version="1.0" encoding="UTF-8"?>`;
        xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

        // Home page
        xml += `<url><loc>${baseUrl}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>`;

        // Article pages
        articlesSnapshot.docs.forEach(doc => {
            const article = doc.data();
            const articleUrl = `${baseUrl}/article/${doc.id}`;
            if (article.createdAt && typeof article.createdAt.toDate === 'function') {
                const lastMod = article.createdAt.toDate().toISOString().split('T')[0]; // Format as YYYY-MM-DD
                xml += `<url>`;
                xml += `<loc>${articleUrl}</loc>`;
                xml += `<lastmod>${lastMod}</lastmod>`;
                xml += `<changefreq>weekly</changefreq><priority>0.8</priority>`;
                xml += `</url>`;
            }
        });

        xml += `</urlset>`;

        // Update cache
        sitemapCache = xml;
        cacheTimestamp = now;

        res.header('Content-Type', 'application/xml');
        res.send(xml);

    } catch (error) {
        console.error('Error generating sitemap:', error);
        res.status(500).send('Error generating sitemap');
    }
});


// API route to generate blog post
app.post('/api/generate', async (req: any, res: any) => {
  const { keyword } = req.body;

  if (!keyword || typeof keyword !== 'string') {
    return res.status(400).json({ error: 'キーワードは必須です。' });
  }

  // API_KEY must be set as an environment variable on the server
  const API_KEY = process.env.API_KEY;
  if (!API_KEY) {
    console.error('API_KEY environment variable not set.');
    return res.status(500).json({ error: 'サーバーの設定にエラーがあります。管理者に連絡してください。' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const model = 'gemini-2.5-flash';

    const response = await ai.models.generateContent({
      model,
      contents: `キーワード「${keyword}」に関するアフィリエイトブログ記事を、マークダウン形式で生成してください。最初の見出し（#）を記事のタイトルとしてください。`,
      config: {
        systemInstruction: 'あなたは、SEOとアフィリエイトマーケティングに精通したプロのコンテンツライターです。提供されたキーワードに基づき、読者の興味を引きつけ、検索エンジンで上位表示されやすい、高品質なブログ記事を生成してください。記事には、明確で魅力的なタイトルと、構造化された本文（序論、本論、結論）を含めてください。本文は、見出しや箇条書きを用いて、読者が情報を消化しやすいように整理してください。',
        tools: [{googleSearch: {}}],
      },
    });
    
    const responseText = response.text;
    
    // Robust validation for the API response
    if (typeof responseText !== 'string' || responseText.trim() === '') {
        console.error('Gemini API returned an empty or invalid response text.');
        throw new Error('AIが有効な応答を生成できませんでした。');
    }

    // --- Parse Markdown response ---
    const lines = responseText.split('\n');
    let title = `「${keyword}」について`; // Default title
    let content = responseText;
    
    const titleIndex = lines.findIndex(line => line.startsWith('# '));
    if (titleIndex !== -1) {
      title = lines[titleIndex].substring(2).trim();
      content = lines.slice(titleIndex + 1).join('\n').trim();
    }
    // --- ---

    // --- Extract grounding sources ---
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = groundingChunks.map((chunk: any) => ({
      uri: chunk.web.uri,
      title: chunk.web.title,
    })).filter((source: any) => source.uri && source.title);
    // --- ---

    res.json({ title, content, sources });

  } catch (error) {
    console.error('Error calling Gemini API:', error);
    const errorMessage = error instanceof Error ? error.message : '不明なエラーが発生しました。';
    res.status(500).json({ error: `記事の生成中にエラーが発生しました: ${errorMessage}` });
  }
});

// Serve static files from the React app
(app.use as any)(express.static(path.join(__dirname, '../dist')));

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
(app.get as any)('*', (req: any, res: any) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});