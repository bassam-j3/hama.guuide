import axiosInstance, { graphqlInstance } from '../axiosConfig';

export const fetchPostsByServiceSlug = async (serviceSlug) => {
  const query = `
    query GetPostsBySlug($slug: String!) {
      postsForSlug(slug: $slug) {
        nodes {
          id title payload imageUrl ratingAvg ratingCount createdAt
          location { latitude longitude }
        }
      }
    }
  `;
  try {
    const response = await graphqlInstance.post('', { query, variables: { slug: serviceSlug } });
    if (response.data.errors) return [];
    const nodes = response.data?.data?.postsForSlug?.nodes || [];
    return nodes.map(post => ({
      ...post, payload: typeof post.payload === 'string' ? JSON.parse(post.payload) : (post.payload || {})
    }));
  } catch (error) { return []; }
};

export const getPostById = async (serviceSlug, postId) => {
    const post = await axiosInstance.get(`/${serviceSlug}/${postId}`);
    let latitude = 0, longitude = 0;
    if (post.location) { latitude = post.location.latitude || post.location.y || 0; longitude = post.location.longitude || post.location.x || 0; }
    let parsedPayload = post.payload;
    if (typeof parsedPayload === 'string') { try { parsedPayload = JSON.parse(parsedPayload); } catch { parsedPayload = {}; } }
    return { ...post, latitude: parseFloat(latitude) || 0, longitude: parseFloat(longitude) || 0, payload: parsedPayload };
};

export const createPostREST = async (serviceSlug, postData) => {
  return await axiosInstance.post(`/${serviceSlug}`, {
    title: postData.title, imageUrl: postData.imageUrl || null, payload: postData.payload, 
    latitude: parseFloat(postData.latitude) || 0, longitude: parseFloat(postData.longitude) || 0
  });
};

export const updatePostREST = async (serviceSlug, postId, postData) => {
  return await axiosInstance.put(`/${serviceSlug}/${postId}`, {
    title: postData.title, payload: postData.payload,
    latitude: parseFloat(postData.latitude) || 0, longitude: parseFloat(postData.longitude) || 0
  });
};

export const deletePostREST = async (serviceSlug, postId) => {
  return await axiosInstance.delete(`/${serviceSlug}/${postId}`);
};

export const fetchAllAll = async () => {
  const query = `query GetAllPosts { posts(order: { createdAt: DESC }) { nodes { id title createdAt service { slug title } } } }`;
  try {
      const response = await graphqlInstance.post('', { query });
      return response.data?.data?.posts?.nodes || [];
  } catch (error) { return []; }
};

// 🚀 مسارات التقييم (Swagger)
export const deletePostRating = async (postId) => {
    return await axiosInstance.delete(`/posts/${postId}/rating`);
};