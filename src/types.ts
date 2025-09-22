export interface Source {
  uri: string;
  title: string;
}

export interface Article {
  id: string;
  title: string;
  content: string;
  keyword: string;
  createdAt: string;
  sources?: Source[];
  thumbnailUrl?: string;
  _tempId?: string;
}

export type View = 'home' | 'generating' | 'editing' | 'list' | 'article';