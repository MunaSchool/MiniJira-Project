import { useEffect, useState } from 'react';
import { createComment, getComments, type Comment } from '@/services/comments.service';
import { toast } from 'sonner';

interface CommentsSectionProps {
  taskId: string;
  expanded: boolean;
  onToggle: () => void;
}

export function CommentsSection({ taskId, expanded, onToggle }: CommentsSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!expanded) return;
    setLoading(true);
    getComments(taskId)
      .then(setComments)
      .catch(() => toast.error('Failed to load comments'))
      .finally(() => setLoading(false));
  }, [taskId, expanded]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    try {
      const comment = await createComment(taskId, text.trim());
      setComments((prev) => [...prev, comment]);
      setText('');
    } catch {
      toast.error('Failed to post comment');
    }
  };

  return (
    <div className="mt-3 border-t border-slate-200 pt-2">
      <button type="button" className="text-sm text-slate-600 hover:text-blue-600" onClick={onToggle}>
        Comments {expanded ? '▲' : '▼'}
      </button>
      {expanded ? (
        <div className="mt-2 space-y-2">
          {loading ? <p className="text-xs text-slate-500">Loading…</p> : null}
          {comments.map((c) => (
            <div key={c.commentId} className="rounded bg-slate-50 px-2 py-1 text-xs text-slate-700">
              <p>{c.text}</p>
              <p className="text-[10px] text-slate-400">{new Date(c.createdAt).toLocaleString()}</p>
            </div>
          ))}
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Add a comment…"
              className="flex-1 rounded border border-slate-200 px-2 py-1 text-xs"
            />
            <button type="submit" className="rounded bg-blue-600 px-2 py-1 text-xs text-white">
              Post
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
