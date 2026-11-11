import {
  User, Book, Chapter, BookshelfGroup, Review, Club, ClubThread, ClubComment, ActivityItem,
  DirectMessage, ChatContact, AdminStats
} from '@/types/library';

const BASE_URL = '/api';

export function getStoredUserId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('folio_current_user_id') || null;
}

export function setStoredUserId(id: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('folio_current_user_id', id);
  }
}

export function clearStoredUserId(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('folio_current_user_id');
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const currentUserId = getStoredUserId();
  const headers = new Headers(options.headers || {});
  if (currentUserId) {
    headers.set('X-User-Id', currentUserId);
  }
  if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errorMsg = `Request failed: ${res.statusText}`;
    try {
      const errJson = await res.json();
      if (errJson && errJson.detail) {
        errorMsg = typeof errJson.detail === 'string' ? errJson.detail : JSON.stringify(errJson.detail);
      }
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }

  return res.json();
}

export const api = {
  // Auth & User
  getCurrentUser: async () => {
    const uid = getStoredUserId();
    if (!uid) return null;
    try {
      return await request<User>('/users/current');
    } catch {
      return null;
    }
  },
  getUsers: () => request<User[]>('/users'),
  getUserProfile: (userId: string) => request<User>(`/users/${userId}`),
  updateUserProfile: (userId: string, data: Partial<User>) =>
    request<User>(`/users/${userId}`, { method: 'PUT', body: JSON.stringify(data) }),
  login: (data: { email: string; password: string }) =>
    request<{ token: string; user: User }>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  signup: (data: { email: string; password: string; username: string; display_name: string; bio?: string }) =>
    request<{ token: string; user: User }>('/auth/signup', { method: 'POST', body: JSON.stringify(data) }),
  forgotPassword: (email: string) =>
    request<{ message: string; demo_token?: string; reset_url?: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
  resetPassword: (token: string, new_password: string) =>
    request<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, new_password }),
    }),

  // Books
  getBooks: (params?: { genre?: string; status?: string; search?: string; author_id?: string; sort_by?: string }) => {
    const q = new URLSearchParams();
    if (params?.genre) q.set('genre', params.genre);
    if (params?.status) q.set('status', params.status);
    if (params?.search) q.set('search', params.search);
    if (params?.author_id) q.set('author_id', params.author_id);
    if (params?.sort_by) q.set('sort_by', params.sort_by);
    return request<Book[]>(`/books?${q.toString()}`);
  },
  getBook: (id: string) => request<Book>(`/books/${id}`),
  createBook: (data: Partial<Book>) =>
    request<{ id: string; first_chapter_id: string; message: string }>('/books', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateBook: (id: string, data: Partial<Book>) =>
    request<{ message: string }>(`/books/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteBook: (id: string) => request<{ message: string }>(`/books/${id}`, { method: 'DELETE' }),

  // Chapters & Author Studio
  getChapters: (bookId: string) => request<Chapter[]>(`/books/${bookId}/chapters`),
  getChapter: (chapterId: string) => request<Chapter>(`/chapters/${chapterId}`),
  createChapter: (bookId: string, data: { title: string; content?: string }) =>
    request<Chapter>(`/books/${bookId}/chapters`, { method: 'POST', body: JSON.stringify(data) }),
  updateChapter: (chapterId: string, data: Partial<Chapter>) =>
    request<Chapter>(`/chapters/${chapterId}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteChapter: (chapterId: string) =>
    request<{ message: string }>(`/chapters/${chapterId}`, { method: 'DELETE' }),
  reorderChapters: (bookId: string, chapterIds: string[]) =>
    request<{ message: string }>(`/books/${bookId}/chapters/reorder`, {
      method: 'POST',
      body: JSON.stringify({ chapter_ids: chapterIds }),
    }),

  // Reading Progress
  getProgress: (bookId: string) => request<any>(`/books/${bookId}/progress`),
  saveProgress: (bookId: string, chapterId: string, scrollPercentage: number) =>
    request<{ message: string }>(`/books/${bookId}/progress`, {
      method: 'POST',
      body: JSON.stringify({ chapter_id: chapterId, scroll_percentage: scrollPercentage }),
    }),

  // Bookshelves
  getBookshelves: () => request<BookshelfGroup>('/bookshelves'),
  toggleBookshelf: (bookId: string, shelfType: string, listName?: string) =>
    request<{ action: string; shelf_type: string | null }>('/bookshelves', {
      method: 'POST',
      body: JSON.stringify({ book_id: bookId, shelf_type: shelfType, list_name: listName }),
    }),

  // Reviews
  getReviews: (bookId: string) => request<Review[]>(`/books/${bookId}/reviews`),
  submitReview: (bookId: string, rating: number, reviewText: string) =>
    request<{ message: string }>(`/books/${bookId}/reviews`, {
      method: 'POST',
      body: JSON.stringify({ rating, review_text: reviewText }),
    }),
  upvoteReview: (reviewId: string) =>
    request<{ upvoted: boolean; helpful_count: number }>(`/reviews/${reviewId}/upvote`, {
      method: 'POST',
    }),

  // Friends & Social
  getFriends: () => request<{ friends: any[]; pending_received: any[]; suggested: any[] }>('/friends'),
  sendFriendRequest: (targetUserId: string) =>
    request<{ message: string }>('/friends/request', {
      method: 'POST',
      body: JSON.stringify({ target_user_id: targetUserId }),
    }),
  respondFriendRequest: (requesterId: string, action: 'accept' | 'decline') =>
    request<{ message: string }>('/friends/respond', {
      method: 'POST',
      body: JSON.stringify({ requester_id: requesterId, action }),
    }),
  getActivity: () => request<ActivityItem[]>('/activity'),

  // Clubs
  getClubs: () => request<Club[]>('/clubs'),
  getClub: (clubId: string) => request<Club>(`/clubs/${clubId}`),
  createClub: (data: Partial<Club>) =>
    request<{ id: string; message: string }>('/clubs', { method: 'POST', body: JSON.stringify(data) }),
  joinClub: (clubId: string) => request<{ is_member: boolean }>(`/clubs/${clubId}/join`, { method: 'POST' }),
  createThread: (clubId: string, data: { chapter_ref?: string; title: string; content: string }) =>
    request<ClubThread>(`/clubs/${clubId}/threads`, { method: 'POST', body: JSON.stringify(data) }),
  getThreadComments: (threadId: string) => request<ClubComment[]>(`/threads/${threadId}/comments`),
  addThreadComment: (threadId: string, content: string) =>
    request<ClubComment>(`/threads/${threadId}/comments`, { method: 'POST', body: JSON.stringify({ content }) }),

  // Admin
  getAdminStats: () => request<AdminStats>('/admin/stats'),
  getAdminUsers: () => request<User[]>('/admin/users'),
  updateUserAccess: (userId: string, data: { access_status: string; role?: string }) =>
    request<{ message: string; user: User }>(`/admin/users/${userId}/access`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateBookStatusAdmin: (bookId: string, status: string) =>
    request<{ message: string }>(`/admin/books/${bookId}/status`, {
      method: 'POST',
      body: JSON.stringify({ status }),
    }),
  appointAssistant: (userId: string) =>
    request<{ message: string; user: User }>(`/admin/users/${userId}/appoint-assistant`, {
      method: 'POST',
    }),

  // AI Assistant & Bookfinder
  askAiBookFinder: (query: string) =>
    request<{ reply: string; recommendations: Book[]; total_catalog_size: number }>('/ai/bookfinder', {
      method: 'POST',
      body: JSON.stringify({ query }),
    }),

  // Direct Chat & Messaging
  getChatContacts: () => request<ChatContact[]>('/chat/contacts'),
  getChatMessages: (partnerId: string) =>
    request<{ partner: User; messages: DirectMessage[] }>(`/chat/messages/${partnerId}`),
  sendDirectMessage: (receiverId: string, message: string) =>
    request<DirectMessage>('/chat/messages', {
      method: 'POST',
      body: JSON.stringify({ receiver_id: receiverId, message }),
    }),
};
