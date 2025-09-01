// FIX: Changed import to use express namespace directly for Request and Response types to avoid conflict with global DOM types.
// FIX: Import Request and Response types directly from express to resolve type conflicts.
import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import 'dotenv/config';

const app = express();
const port = process.env.PORT || 8080;

// ESM-friendly __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use('/', express.json());

// API route to generate blog post
// FIX: Explicitly use Request and Response types from express.
app.post('/api/generate', async (req: Request, res: Response) => {
  const { keyword } = req.body;

  if (!keyword || typeof keyword !== 'string') {
    return res.status(400).json({ error: 'Keyword is required and must be a string.' });
  }

  // API_KEY must be set as an environment variable on the server
  const API_KEY = process.env.API_KEY;
  if (!API_KEY) {
    console.error('API_KEY environment variable not set.');
    return res.status(500).json({ error: 'Server configuration error.' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const model = 'gemini-2.5-flash';

    const blogPostSchema = {
      type: Type.OBJECT,
      properties: {
        title: {
          type: Type.STRING,
          description: 'SEOに最適化された、魅力的でクリックしたくなるブログ記事のタイトル。',
        },
        content: {
          type: Type.STRING,
          description: 'ブログ記事の本文。序論、本論、結論の構成で、読者が読みやすいように見出し(#)、リスト(-)、太字(**)などのマークダウンを積極的に使用してください。',
        },
      },
      required: ['title', 'content'],
    };

    const response = await ai.models.generateContent({
      model,
      contents: `キーワード「${keyword}」に関するアフィリエイトブログ記事を生成してください。`,
      config: {
        systemInstruction: 'あなたは、SEOとアフィリエイトマーケティングに精通したプロのコンテンツライターです。提供されたキーワードに基づき、読者の興味を引きつけ、検索エンジンで上位表示されやすい、高品質なブログ記事を生成してください。記事には、明確で魅力的なタイトルと、構造化された本文（序論、本論、結論）を含めてください。本文は、見出し、箇条書きリスト、太字など、マークダウン形式を積極的に使用して読みやすくしてください。',
        responseMimeType: 'application/json',
        responseSchema: blogPostSchema,
        temperature: 0.8,
        topP: 0.95,
      },
    });
    
    // To resolve the TypeScript build error "TS18048: 'response.text' is possibly 'undefined'",
    // we add a more explicit and robust type check. This ensures that we have a valid, non-empty string
    // from the Gemini API before attempting to parse it as JSON.
    const responseText = response?.text;

    if (typeof responseText !== 'string' || responseText.length === 0) {
        console.error('Invalid or empty response text received from Gemini API:', response);
        return res.status(500).json({ error: 'AIから有効なテキスト応答を受け取れませんでした。' });
    }
    
    // Now TypeScript is certain that responseText is a non-empty string.
    const jsonText = responseText.trim();
    let parsed;
    try {
      parsed = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('Failed to parse JSON response from Gemini:', jsonText);
      return res.status(500).json({ error: 'AIから予期しない形式の応答がありました。' });
    }

    if (typeof parsed.title === 'string' && typeof parsed.content === 'string') {
      res.status(200).json(parsed);
    } else {
      console.error('Invalid JSON structure received from API:', parsed);
      return res.status(500).json({ error: 'AIが生成したデータの構造が正しくありません。' });
    }
  } catch (error) {
    console.error('Error generating blog post:', error);
    res.status(500).json({ error: 'AIによる記事の生成中にエラーが発生しました。' });
  }
});

// Serve static files from the React app build directory
// The server file will be in dist-server, so we go up one level to find the 'dist' folder
const staticPath = path.join(__dirname, '..', 'dist');
app.use('/', express.static(staticPath));

// The "catchall" handler for client-side routing
// FIX: Explicitly use Request and Response types from express.
app.get('*', (req: Request, res: Response) => {
  res.sendFile(path.join(staticPath, 'index.html'));
});

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
