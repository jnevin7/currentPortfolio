import { useState } from 'react';

const categoryEmoji = { general: '💬', news: '📢', question: '❓' };
const MAX = 280;

function PostForm({ onSubmit, categories }) {
  const [content, setContent]   = useState('');
  const [category, setCategory] = useState('general');

  const byteSize = new Blob([content]).size;

  const handleSubmit = () => {
    if (!content.trim()) return;
    onSubmit({ content, category });
    setContent('');
  };

  return (
    <div className="post-form">
      <textarea
        value={content}
        onChange={e => setContent(e.target.value.slice(0, MAX))}
        placeholder="What's on your mind?"
        rows={3}
      />
      <div className="form-meta">
        <div className="category-pills">
          {categories.map(c => (
            <button
              key={c}
              className={`cat-pill${category === c ? ' active' : ''}`}
              onClick={() => setCategory(c)}
            >
              {categoryEmoji[c]} {c}
            </button>
          ))}
        </div>
        <div className="form-actions">
          <span className="char-count">{content.length}/{MAX}</span>
          <span className="kb-badge">{byteSize}B</span>
          <button
            className="post-btn"
            onClick={handleSubmit}
            disabled={!content.trim()}
          >
            Post
          </button>
        </div>
      </div>
    </div>
  );
}

export default PostForm;