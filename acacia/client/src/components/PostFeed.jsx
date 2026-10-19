const categoryEmoji = { general: '💬', news: '📢', question: '❓' };

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60)    return `${Math.floor(diff)}s ago`;
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function PostCard({ post, onReact }) {
  const byteSize = new Blob([post.content]).size;

  return (
    <article className="post-card">
      <div className="post-header">
        <div className="post-avatar">{post.author.charAt(0).toUpperCase()}</div>
        <div className="post-meta">
          <span className="post-author">{post.author}</span>
          <span className="post-category">{categoryEmoji[post.category]} {post.category}</span>
        </div>
        <span className="post-time">{timeAgo(post.createdAt)}</span>
      </div>
      <p className="post-content">{post.content}</p>
      <div className="post-footer">
        <span className="kb-badge">{byteSize}B</span>
        <button className="react-btn" onClick={() => onReact(post._id)}>
          👍 {post.reactions}
        </button>
      </div>
    </article>
  );
}

function PostFeed({ posts, onReact }) {
  if (posts.length === 0) {
    return <p className="empty">No posts yet — say something!</p>;
  }
  return (
    <div className="feed">
      {posts.map(post => (
        <PostCard key={post._id} post={post} onReact={onReact} />
      ))}
    </div>
  );
}

export default PostFeed;