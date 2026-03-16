import axiosInstance, { graphqlInstance } from '../axiosConfig';

// 🚀 تم تحديث الاستعلام ليتوافق مع التعديلات الأخيرة للباك-إند (Location و إزالة isDeleted)
export const fetchPostsByServiceSlug = async (serviceSlug) => {
  const query = `
    query GetServicePosts($serviceSlug: String!) {
      posts(where: { service: { slug: { eq: $serviceSlug } } }) {
        nodes {
          id
          title
          imageUrl
          createdAt
          payload
          ratingAvg
          ratingCount
          location {
            latitude
            longitude
          }
        }
      }
    }
  `;
  try {
    const response = await graphqlInstance.post('', { 
        query, 
        variables: { serviceSlug: serviceSlug } 
    });
    
    if (response.data.errors) return [];
    const nodes = response.data?.data?.posts?.nodes || [];
    
    return nodes.map(post => ({
      ...post, 
      payload: typeof post.payload === 'string' ? JSON.parse(post.payload) : (post.payload || {})
    }));
  } catch (error) { 
    return []; 
  }
};

export const getPostById = async (serviceSlug, postId) => {
    const post = await axiosInstance.get(`/${serviceSlug}/${postId}`);
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

export const createPostREST = async (serviceSlug, postData) => {
  return await axiosInstance.post(`/${serviceSlug}`, {
    title: postData.title, 
    imageUrl: postData.imageUrl || null, 
    payload: postData.payload, // 👈 إرسالها كـ Object كما كان يعمل في الكود القديم
    latitude: parseFloat(postData.latitude) || 0, 
    longitude: parseFloat(postData.longitude) || 0
  });
};

export const updatePostREST = async (serviceSlug, postId, postData) => {
  return await axiosInstance.put(`/${serviceSlug}/${postId}`, {
    title: postData.title, 
    payload: postData.payload,
    imageUrl: postData.imageUrl || null, 
    latitude: parseFloat(postData.latitude) || 0, 
    longitude: parseFloat(postData.longitude) || 0
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

export const addPostRating = async (postId, ratingValue) => {
    return await axiosInstance.post(`/posts/${postId}/rating`, {
        value: parseInt(ratingValue, 10)
    });
};

export const deletePostRating = async (postId) => {
    return await axiosInstance.delete(`/posts/${postId}/rating`);
};