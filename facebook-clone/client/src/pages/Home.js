import React, { useState, useEffect } from 'react';
import Stories from '../components/Stories/Stories';
import CreatePost from '../components/Feed/CreatePost';
import Post from '../components/Feed/Post';
import api from '../utils/api';
import './Home.css';

const Home = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async (pageNum = 1) => {
    try {
      setLoading(true);
      const response = await api.get(`/posts/feed?page=${pageNum}&limit=10`);
      const newPosts = response.data.posts;

      if (pageNum === 1) {
        setPosts(newPosts);
      } else {
        setPosts(prev => [...prev, ...newPosts]);
      }

      setHasMore(newPosts.length === 10);
      setPage(pageNum);
    } catch (err) {
      console.error('Error fetching posts:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchPosts(page + 1);
    }
  };

  const addPost = (newPost) => {
    setPosts(prev => [newPost, ...prev]);
  };

  const updatePost = (updatedPost) => {
    setPosts(prev => prev.map(post =>
      post._id === updatedPost._id ? updatedPost : post
    ));
  };

  const deletePost = (postId) => {
    setPosts(prev => prev.filter(post => post._id !== postId));
  };

  return (
    <div className="home-page">
      {/* Stories Section */}
      <Stories />

      {/* Create Post */}
      <CreatePost onPost={addPost} />

      {/* Posts Feed */}
      <div className="posts-feed">
        {posts.map((post) => (
          <Post
            key={post._id}
            post={post}
            onUpdate={updatePost}
            onDelete={deletePost}
          />
        ))}

        {loading && (
          <div className="loading-posts">
            <div className="spinner"></div>
          </div>
        )}

        {!loading && posts.length === 0 && (
          <div className="no-posts">
            <h3>No posts to show</h3>
            <p>Add friends or join groups to see posts in your feed.</p>
          </div>
        )}

        {!loading && hasMore && posts.length > 0 && (
          <button className="load-more-btn" onClick={loadMore}>
            Load More
          </button>
        )}
      </div>
    </div>
  );
};

export default Home;
