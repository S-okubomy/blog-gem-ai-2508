import { GoogleGenAI, Type } from "@google/genai";
import { API_KEY } from '../config';

// 環境変数が設定されているか確認します
if (!API_KEY) {
  const errorMessage = "GeminiのAPIキーが設定されていません。プロジェクトルートに .env ファイルを作成し、API_KEY='YOUR_KEY_HERE' の形式で設定してください。";
  document.body.innerHTML = `<div style="font-family: sans-serif; padding: 2rem; color: #b91c1c; background-color: #fee2e2; border: 1px solid #f87171; border-radius: 0.5rem; margin: 2rem;">
    <h1 style="font-size: 1.5rem; font-weight: bold;">設定エラー</h1>
    <p>${errorMessage}</p>
    <p>.env ファイルを作成または確認した後、アプリケーションをリロードしてください。</p>
  </div>`;
  throw new Error(errorMessage);
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const model = "gemini-2.5-flash";

const blogPostSchema = {
  type: Type.OBJECT,
  properties: {
    title: {
      type: Type.STRING,
      description: "SEOに最適化された、魅力的でクリックしたくなるブログ記事のタイトル。",
    },
    content: {
      type: Type.STRING,
      description: "ブログ記事の本文。序論、本論、結論の構成で、段落ごとに改行(\\n)を入れてください。マークダウンは使用しないでください。",
    },
  },
  required: ["title", "content"],
};

export const generateBlogPost = async (keyword: string): Promise<{ title: string; content: string }> => {
  try {
    const response = await ai.models.generateContent({
      model,
      contents: `キーワード「${keyword}」に関するアフィリエイトブログ記事を生成してください。`,
      config: {
        systemInstruction: "あなたは、SEOとアフィリエイトマーケティングに精通したプロのコンテンツライターです。提供されたキーワードに基づき、読者の興味を引きつけ、検索エンジンで上位表示されやすい、高品質なブログ記事を生成してください。記事には、明確で魅力的なタイトルと、構造化された本文（序論、本論、結論）を含めてください。",
        responseMimeType: "application/json",
        responseSchema: blogPostSchema,
        temperature: 0.8,
        topP: 0.95,
      },
    });

    const jsonText = response.text.trim();
    const parsed = JSON.parse(jsonText);
    
    if (typeof parsed.title === 'string' && typeof parsed.content === 'string') {
      return parsed;
    } else {
      throw new Error("Invalid JSON structure received from API.");
    }
  } catch (error) {
    console.error("Error generating blog post:", error);
    throw new Error("AIによる記事の生成に失敗しました。しばらくしてからもう一度お試しください。");
  }
};