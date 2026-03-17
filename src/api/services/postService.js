import axiosInstance, { graphqlInstance } from '../axiosConfig';

export const fetchPostsByServiceSlug = async (serviceSlug) => {
  const query = `
    query GetServicePosts($serviceSlug: String!) {
      posts(where: { service: { slug: { eq: $serviceSlug } } }) {
        nodes { id title imageUrl createdAt payload ratingAvg ratingCount location { latitude longitude } }
      }
    }
  `;
  try {
    const response = await graphqlInstance.post('', { query, variables: { serviceSlug } });
    if (response.data.errors) return [];
    const nodes = response.data?.data?.posts?.nodes || [];
    return nodes.map(post => ({
      ...post, 
      payload: typeof post.payload === 'string' ? JSON.parse(post.payload) : (post.payload || {})
    }));
  } catch (error) { return []; }
};

export const getPostById = async (serviceSlug, postId) => {
    const response = await axiosInstance.get(`/${serviceSlug}/${postId}`);
    const post = response.data || response; // 🚀 فك الغلاف
    let latitude = 0, longitude = 0;
    if (post.location) { 
        latitude = post.location.latitude || post.location.y || 0; 
        longitude = post.location.longitude || post.location.x || 0; 
    }
    let parsedPayload = post.payload;
    if (typeof parsedPayload === 'string') { 
        try { parsedPayload = JSON.parse(parsedPayload); } catch { parsedPayload = {}; } 
    }
    return { ...post, latitude: parseFloat(latitude) || 0, longitude: parseFloat(longitude) || 0, payload: parsedPayload };
};

export const createPostREST = async (serviceSlug, data) => {
  const response = await axiosInstance.post(`/${serviceSlug}`, {
    title: data.title, 
    imageUrl: data.imageUrl || null, 
    payload: data.payload, 
    latitude: parseFloat(data.latitude) || 0, 
    longitude: parseFloat(data.longitude) || 0
  });
  return response.data;
};

export const updatePostREST = async (serviceSlug, postId, data) => {
  const response = await axiosInstance.put(`/${serviceSlug}/${postId}`, {
    title: data.title, 
    payload: data.payload,
    imageUrl: data.imageUrl || null, 
    latitude: parseFloat(data.latitude) || 0, 
    longitude: parseFloat(data.longitude) || 0
  });
  return response.data;
};

export const deletePostREST = async (serviceSlug, postId) => {
  const response = await axiosInstance.delete(`/${serviceSlug}/${postId}`);
  return response.data;
};

export const fetchAllAll = async () => {
  const query = `query GetAllPosts { posts(order: { createdAt: DESC }) { nodes { id title createdAt service { slug title } } } }`;
  try {
      const response = await graphqlInstance.post('', { query });
      return response.data?.data?.posts?.nodes || [];
  } catch (error) { return []; }
};

export const deletePostRating = async (postId) => {
    const response = await axiosInstance.delete(`/posts/${postId}/rating`);
    return response.data;
};