// FIX: Import Request and Response types directly from express to avoid conflicts with DOM library types.
import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { GoogleGenAI } from '@google/genai';
import 'dotenv/config';
import admin from 'firebase-admin';

// ESM-friendly __dirname and project root calculation
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = __dirname.endsWith('dist-server')
  ? path.join(__dirname, '..') // In production, go up from dist-server
  : __dirname; // In development, __dirname is the project root

// --- Firebase Admin SDK Initialization ---
try {
  if (!admin.apps.length) {
    const { 
      FIREBASE_PROJECT_ID, 
      FIREBASE_PRIVATE_KEY, 
      FIREBASE_CLIENT_EMAIL 
    } = process.env;

    if (FIREBASE_PRIVATE_KEY && FIREBASE_CLIENT_EMAIL && FIREBASE_PROJECT_ID) {
      // Primary method: Use environment variables.
      // This is secure and ideal for environments like Cloud Run or local .env files.
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: FIREBASE_PROJECT_ID,
          // Important: Replace escaped newlines in the private key.
          privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
          clientEmail: FIREBASE_CLIENT_EMAIL,
        }),
      });
      console.log('✅ Firebase Admin SDK initialized successfully using environment variables.');
    } else {
      // Fallback method: Use Application Default Credentials.
      // This is useful for local development when gcloud CLI is configured.
      admin.initializeApp();
      console.log('✅ Firebase Admin SDK initialized using Application Default Credentials.');
      console.warn('⚠️  For production, setting FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, and FIREBASE_CLIENT_EMAIL environment variables is the recommended and most reliable method.');
    }
  }
} catch (error: any) {
  console.error("🔴 FATAL: Firebase Admin initialization failed.");
  console.error("This means the server cannot connect to the database.");
  
  if (error.message.includes('Could not load the default credentials')) {
    console.error("\n--- HOW TO FIX ---");
    console.error("1. RECOMMENDED: Set environment variables in your '.env' file or your hosting environment:");
    console.error("   - FIREBASE_PROJECT_ID");
    console.error("   - FIREBASE_CLIENT_EMAIL");
    console.error("   - FIREBASE_PRIVATE_KEY");
    console.error("   (Copy these values from the service account JSON file you can download from Firebase Console)");
    console.error("\n2. FOR LOCAL DEVELOPMENT ONLY: Run this command in your terminal:");
    console.error("   - gcloud auth application-default login");
    console.error("------------------\n");
  } else {
    console.error("An unexpected error occurred during initialization:", error);
  }
  
  // Exit the process because the server is non-functional without a database connection.
  process.exit(1);
}

const app = express();
const port = process.env.PORT || 8080;
const db = admin.firestore();

app.use(express.json());

// --- Dynamic robots.txt Generation ---
// FIX: Use imported Request and Response types for route handlers.
app.get('/robots.txt', (req: Request, res: Response) => {
  const baseUrl = process.env.SITE_BASE_URL?.trim();
  if (!baseUrl) {
      console.error('🔴 ERROR: SITE_BASE_URL is not set for robots.txt generation.');
      return res.status(500).send('Server configuration error: SITE_BASE_URL is not set.');
  }
  // Construct the absolute URL for the sitemap
  const sitemapUrl = new URL('/sitemap.xml', baseUrl).href;
  const robotsTxtContent = `User-agent: *\nAllow: /\nSitemap: ${sitemapUrl}\n`;
  res.header('Content-Type', 'text/plain');
  res.send(robotsTxtContent);
});

// --- Sitemap Generation with Cache ---
// Cache sitemap for 1 hour to reduce DB reads
const sitemapCache = {
  xml: '',
  timestamp: 0,
};
const SITEMAP_CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

// FIX: Use imported Request and Response types for route handlers.
app.get('/sitemap.xml', async (req: Request, res: Response) => {
  const now = Date.now();
  if (sitemapCache.xml && (now - sitemapCache.timestamp < SITEMAP_CACHE_DURATION)) {
    res.header('Content-Type', 'application/xml');
    return res.send(sitemapCache.xml);
  }

  const baseUrl = process.env.SITE_BASE_URL;
  if (!baseUrl) {
    console.error('🔴 ERROR: SITE_BASE_URL is not set in your .env file.');
    return res.status(500).send('Server configuration error: SITE_BASE_URL is not set.');
  }

  try {
    const articlesSnapshot = await db.collection('articles').get();
    
    // Sort documents by createdAt date in descending order on the server side
    // to avoid issues with missing fields in Firestore queries.
    const sortedDocs = articlesSnapshot.docs.sort((a, b) => {
        const dateA = a.data().createdAt?.toDate ? a.data().createdAt.toDate() : new Date(0);
        const dateB = b.data().createdAt?.toDate ? b.data().createdAt.toDate() : new Date(0);
        return dateB.getTime() - dateA.getTime();
    });

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
    xml += `  <url>\n    <loc>${baseUrl}/</loc>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>\n`;

    sortedDocs.forEach(doc => {
      const article = doc.data();
      const articleUrl = `${baseUrl}/article/${doc.id}`;
      // Ensure createdAt field exists and is a valid timestamp
      if (article.createdAt && typeof article.createdAt.toDate === 'function') {
        const lastMod = article.createdAt.toDate().toISOString().split('T')[0];
        xml += `  <url>\n    <loc>${articleUrl}</loc>\n    <lastmod>${lastMod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
      }
    });

    xml += `</urlset>`;
    
    sitemapCache.xml = xml;
    sitemapCache.timestamp = now;

    res.header('Content-Type', 'application/xml');
    res.send(xml);
  } catch (error) {
    console.error('Error generating sitemap:', error);
    res.status(500).send('Error generating sitemap');
  }
});

// --- NEW: API endpoints for fetching articles ---

// Endpoint to get total article count
// FIX: Use imported Request and Response types for route handlers.
app.get('/api/articles-count', async (req: Request, res: Response) => {
  try {
    const snapshot = await db.collection('articles').count().get();
    res.json({ count: snapshot.data().count });
  } catch (error) {
    console.error('Error getting articles count:', error);
    res.status(500).json({ error: '記事の総数の取得に失敗しました。' });
  }
});

// Endpoint to get a paginated list of articles
// FIX: Use imported Request and Response types for route handlers.
app.get('/api/articles', async (req: Request, res: Response) => {
  try {
    const { pageSize = '10', startAfter } = req.query;
    const limit = parseInt(pageSize as string, 10);
    
    let query = db.collection('articles').orderBy('createdAt', 'desc');

    if (startAfter && typeof startAfter === 'string') {
      const startAfterDoc = await db.collection('articles').doc(startAfter).get();
      if (startAfterDoc.exists) {
        query = query.startAfter(startAfterDoc);
      }
    }
    
    const snapshot = await query.limit(limit).get();
    const articles = snapshot.docs.map(doc => {
      const data = doc.data();
      const createdAt = data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString();
      return { ...data, id: doc.id, createdAt };
    });
    
    // Get the ID of the last document for the next page cursor
    const lastDocId = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1].id : null;

    res.json({ articles, lastDocId });
  } catch (error) {
    console.error('Error fetching articles:', error);
    res.status(500).json({ error: '記事の取得に失敗しました。' });
  }
});

// Endpoint to get a single article by ID
// FIX: Use imported Request and Response types for route handlers.
app.get('/api/articles/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const docRef = db.collection('articles').doc(id);
    const docSnap = await docRef.get();

    if (docSnap.exists) {
      const data = docSnap.data()!;
      const createdAt = data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString();
      res.json({ ...data, id: docSnap.id, createdAt });
    } else {
      res.status(404).json({ error: '記事が見つかりませんでした。' });
    }
  } catch (error) {
    console.error('Error fetching article by ID:', error);
    res.status(500).json({ error: '記事の取得に失敗しました。' });
  }
});


// --- Gemini API Endpoint ---
// FIX: Use imported Request and Response types for route handlers.
app.post('/api/generate', async (req: Request, res: Response) => {
  const { keyword } = req.body;

  if (!keyword || typeof keyword !== 'string') {
    return res.status(400).json({ error: 'キーワードは必須です。' });
  }

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


// --- SSR Helpers ---
const createSummaryForSsr = (markdown: string, length: number = 120): string => {
  if (!markdown) return '';
  // This is a simplified, server-safe version of the client-side createSummary function.
  // It removes markdown images, headings, and other block-level elements.
  const plainText = markdown
    .replace(/!\[.*?\]\(.*?\)/g, '') // Remove markdown images
    .replace(/<[^>]+>/g, '') // Remove any HTML tags
    .replace(/[#*`>|~-]/g, '') // Remove markdown characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
  
  if (plainText.length > length) {
    return plainText.substring(0, length) + '...';
  }
  return plainText;
};

const extractFirstImageUrlForSsr = (markdown: string): string | null => {
  if (!markdown) return null;
  const match = markdown.match(/!\[.*?\]\((.*?)\)/);
  if (match && match[1]) {
    return match[1];
  }
  const htmlMatch = markdown.match(/<img[^>]+src="([^">]+)"/);
  return htmlMatch ? htmlMatch[1] : null;
};


// --- Static File Serving & SSR for OGP ---
const staticDir = path.join(projectRoot, 'dist');
const indexPath = path.join(staticDir, 'index.html');

// Serve static assets from the 'dist' directory, but prevent it from
// automatically serving index.html for root requests. This ensures
// the catch-all route handles OGP tag replacement for the homepage.
app.use(express.static(staticDir, { index: false }));

// This catch-all route handles all page loads, including direct navigation to article pages.
// FIX: Use imported Request and Response types for route handlers.
app.get('*', async (req: Request, res: Response) => {
  try {
    const htmlTemplate = await fs.promises.readFile(indexPath, 'utf-8');

    const baseUrl = process.env.SITE_BASE_URL?.trim() || '';
    const defaultTitle = 'かしこいママの暮らしノート';
    const defaultDescription = '知って得する暮らしのヒントや、育児の裏ワザなど、ママの毎日を応援する情報が満載のブログです。';
    const defaultImageUrl = new URL('/og-image.png', baseUrl).href;

    let finalHtml = htmlTemplate;
    const articleMatch = req.path.match(/^\/article\/([a-zA-Z0-9]+)$/);

    if (articleMatch) {
      // It's an article page, fetch data for OGP tags
      const articleId = articleMatch[1];
      const docSnap = await db.collection('articles').doc(articleId).get();

      if (docSnap.exists) {
        const article = docSnap.data()!;
        const pageTitle = `${article.title} | ${defaultTitle}`;
        const pageDescription = createSummaryForSsr(article.content);
        const imageUrl = extractFirstImageUrlForSsr(article.content);
        const absoluteImageUrl = imageUrl ? new URL(imageUrl, baseUrl).href : defaultImageUrl;
        const pageUrl = new URL(req.path, baseUrl).href;

        finalHtml = htmlTemplate
          .replace(/__OG_TITLE__/g, pageTitle)
          .replace(/__OG_DESCRIPTION__/g, pageDescription)
          .replace(/__OG_IMAGE__/g, absoluteImageUrl)
          .replace(/__OG_URL__/g, pageUrl)
          .replace(/__OG_TYPE__/g, 'article');
      } else {
        // Article not found, serve with default tags but maybe redirect later
        finalHtml = htmlTemplate
          .replace(/__OG_TITLE__/g, `記事が見つかりません | ${defaultTitle}`)
          .replace(/__OG_DESCRIPTION__/g, defaultDescription)
          .replace(/__OG_IMAGE__/g, defaultImageUrl)
          .replace(/__OG_URL__/g, new URL(req.path, baseUrl).href)
          .replace(/__OG_TYPE__/g, 'website');
      }
    } else {
      // It's the homepage or another non-article page
      finalHtml = htmlTemplate
        .replace(/__OG_TITLE__/g, defaultTitle)
        .replace(/__OG_DESCRIPTION__/g, defaultDescription)
        .replace(/__OG_IMAGE__/g, defaultImageUrl)
        .replace(/__OG_URL__/g, baseUrl + '/')
        .replace(/__OG_TYPE__/g, 'website');
    }

    res.send(finalHtml);

  } catch (error) {
    console.error("Error during SSR processing:", error);
    // If something goes wrong (e.g., index.html not found), send a fallback response.
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send('The application has not been built yet. Please run "npm run build".');
    }
  }
});


app.listen(port, () => {
  console.log(`Server listening on port http://localhost:${port}`);
});
