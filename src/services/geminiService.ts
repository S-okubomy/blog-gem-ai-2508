export const generateBlogPost = async (keyword: string): Promise<{ title: string; content: string }> => {
  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ keyword }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'サーバーから不明なエラーが返されました。' }));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (typeof data.title === 'string' && typeof data.content === 'string') {
      return data;
    } else {
      throw new Error("APIから無効なデータ構造を受け取りました。");
    }
  } catch (error) {
    console.error("Error generating blog post:", error);
    if (error instanceof Error) {
        // Pass the specific error message from the backend if available
        throw new Error(error.message || "AIによる記事の生成に失敗しました。しばらくしてからもう一度お試しください。");
    }
    throw new Error("AIによる記事の生成に失敗しました。しばらくしてからもう一度お試しください。");
  }
};