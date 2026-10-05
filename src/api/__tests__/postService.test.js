import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchPostsByServiceSlug, fetchAllAll } from '../services/postService';
import { graphqlInstance } from '../axiosConfig';

vi.mock('../axiosConfig', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
  graphqlInstance: {
    post: vi.fn()
  }
}));

describe('postService (Hybrid Architecture)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetchPostsByServiceSlug uses GraphQL', async () => {
    const mockNodes = [{ id: 1, title: 'Post 1', payload: '{"prop":"val"}' }];
    graphqlInstance.post.mockResolvedValue({
      data: { data: { posts: { nodes: mockNodes } } }
    });

    const result = await fetchPostsByServiceSlug('test-slug');

    expect(graphqlInstance.post).toHaveBeenCalled();
    expect(result[0].payload).toEqual({ prop: 'val' });
  });

  it('fetchAllAll uses GraphQL', async () => {
    const mockNodes = [{ id: 1, title: 'Post 1' }];
    graphqlInstance.post.mockResolvedValue({
      data: { data: { posts: { nodes: mockNodes } } }
    });

    const result = await fetchAllAll();

    expect(graphqlInstance.post).toHaveBeenCalled();
    expect(result[0].title).toBe('Post 1');
  });
});
