export interface Article {
  id: string;
  title: string;
  content: string;
  keyword: string;
  createdAt: string;
}

export type View = 'home' | 'generating' | 'editing' | 'list' | 'article';