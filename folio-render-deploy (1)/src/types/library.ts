export interface User {
  id: string;
  email: string;
  username: string;
  display_name: string;
  avatar_url?: string;
  bio?: string;
  favorite_genres?: string[];
  role?: 'admin' | 'author' | 'reader';
  access_status?: 'granted' | 'pending' | 'revoked';
  books_count?: number;
  reviews_count?: number;
  created_at?: number;
  stats?: {
    books_published: number;
    books_completed: number;
    reviews_count: number;
    clubs_count: number;
    words_read: number;
    reading_streak_days: number;
  };
}

export interface Chapter {
  id: string;
  book_id: string;
  chapter_number: number;
  title: string;
  content: string;
  word_count: number;
  order_index: number;
  created_at: number;
  updated_at: number;
  has_illustration?: boolean | number;
  prev_chapter?: { id: string; title: string; chapter_number: number } | null;
  next_chapter?: { id: string; title: string; chapter_number: number } | null;
}

export interface Book {
  id: string;
  author_id: string;
  author_name?: string;
  author_avatar?: string;
  author_bio?: string;
  title: string;
  subtitle?: string;
  description: string;
  cover_image?: string;
  genre: string;
  language?: string;
  mature_content?: number | boolean;
  status: 'draft' | 'in_review' | 'published' | 'archived';
  published_at?: number | null;
  created_at: number;
  updated_at: number;
  avg_rating?: number;
  review_count?: number;
  chapter_count?: number;
  total_words?: number;
  reading_time_mins?: number;
  shelf_status?: 'want_to_read' | 'reading' | 'completed' | 'custom' | null;
  custom_shelf_name?: string | null;
  chapters?: Chapter[];
  rating_distribution?: Record<number, number>;
  reading_progress?: {
    chapter_id: string;
    scroll_percentage: number;
    updated_at: number;
  } | null;
}

export interface BookshelfItem {
  shelf_entry_id: string;
  shelf_type: 'want_to_read' | 'reading' | 'completed' | 'custom';
  list_name?: string | null;
  added_at: number;
  book_id: string;
  title: string;
  subtitle?: string;
  description: string;
  cover_image?: string;
  genre: string;
  author_name: string;
  scroll_percentage?: number | null;
  last_read_chapter_id?: string | null;
}

export interface BookshelfGroup {
  want_to_read: BookshelfItem[];
  reading: BookshelfItem[];
  completed: BookshelfItem[];
  custom: BookshelfItem[];
}

export interface Review {
  id: string;
  user_id: string;
  book_id: string;
  rating: number;
  review_text?: string;
  helpful_count: number;
  created_at: number;
  display_name: string;
  avatar_url?: string;
  username: string;
  user_upvoted?: boolean;
}

export interface Club {
  id: string;
  name: string;
  description: string;
  cover_image?: string;
  book_of_the_month_id?: string;
  founder_id: string;
  founder_name?: string;
  member_count: number;
  created_at: number;
  book_title?: string;
  book_cover?: string;
  book_genre?: string;
  is_member?: boolean;
  members?: Array<{
    id: string;
    display_name: string;
    avatar_url: string;
    username: string;
    role: string;
  }>;
  threads?: ClubThread[];
}

export interface ClubThread {
  id: string;
  club_id: string;
  user_id: string;
  author_name: string;
  author_avatar?: string;
  chapter_ref?: string;
  title: string;
  content: string;
  comment_count: number;
  created_at: number;
}

export interface ClubComment {
  id: string;
  thread_id: string;
  user_id: string;
  author_name: string;
  author_avatar?: string;
  username: string;
  content: string;
  created_at: number;
}

export interface ActivityItem {
  id: string;
  user_id: string;
  display_name: string;
  avatar_url?: string;
  username: string;
  activity_type: 'published_book' | 'completed_chapter' | 'started_book' | 'wrote_review' | 'created_book' | 'joined_club';
  entity_id: string;
  entity_title: string;
  metadata?: any;
  created_at: number;
}

export interface ReaderSettings {
  fontFamily: 'serif' | 'sans' | 'mono';
  fontSize: number; // 14 to 26
  lineHeight: 'compact' | 'comfortable' | 'relaxed';
  theme: 'light' | 'sepia' | 'dark';
}

export interface DirectMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  created_at: number;
  is_read: number;
  sender_name?: string;
  sender_avatar?: string;
  receiver_name?: string;
  receiver_avatar?: string;
}

export interface ChatContact {
  id: string;
  username: string;
  display_name: string;
  avatar_url?: string;
  bio?: string;
  role?: string;
  last_message?: { message: string; created_at: number; sender_id: string } | null;
  unread_count: number;
  is_friend: boolean;
}

export interface AdminStats {
  is_admin: boolean;
  total_users: number;
  total_books: number;
  published_books: number;
  pending_books: number;
  total_chapters: number;
  total_words: number;
  total_reviews: number;
  total_clubs: number;
  total_messages: number;
}
