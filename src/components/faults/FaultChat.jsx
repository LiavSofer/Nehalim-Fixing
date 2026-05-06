import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Bot, RotateCcw } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { useQueryClient } from '@tanstack/react-query';

const AUTO_EVENT_LABELS = {
  assigned: 'התקלה הועברה לטיפול',
  repaired: 'התקלה טופלה ומחכה לאישור',
  closed: 'מאשר טיפול - התקלה נסגרה',
  returnedToWorker: null, // rendered specially below
};

export default function FaultChat({ fault, currentUser }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!fault?.id) return;
    fetchComments();

    const unsubscribe = base44.entities.FaultComment.subscribe((event) => {
      if (event.data?.faultId === fault.id) {
        fetchComments();
      }
    });
    return () => unsubscribe();
  }, [fault?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  const fetchComments = async () => {
    try {
      const data = await base44.entities.FaultComment.filter({ faultId: fault.id }, 'created_date', 100);
      setComments(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!newComment.trim() || sending) return;
    setSending(true);
    try {
      await base44.entities.FaultComment.create({
        faultId: fault.id,
        comment: newComment.trim(),
        userId: currentUser?.id || '',
        userName: currentUser?.full_name || '',
        userProfileImage: currentUser?.profileImage || '',
        type: 'manual',
      });
      setNewComment('');
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (dateStr) => {
    try {
      return format(new Date(dateStr), 'dd.MM.yyyy HH:mm', { locale: he });
    } catch { return ''; }
  };

  if (loading) {
    return <div className="flex justify-center py-6"><div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <div className="flex flex-col gap-3" dir="rtl">
      <h3 className="text-sm font-semibold text-muted-foreground border-b pb-2">שיחה על התקלה</h3>

      {/* Messages */}
      <div className="flex flex-col gap-2 min-h-[60px] max-h-72 overflow-y-auto px-1">
        {comments.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-4">אין הערות עדיין</p>
        )}
        {comments.map((c) => (
          <ChatMessage key={c.id} comment={c} formatTime={formatTime} currentUserId={currentUser?.id} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2 items-end pt-2 border-t">
        <Avatar className="h-8 w-8 flex-shrink-0">
          {currentUser?.profileImage && <AvatarImage src={currentUser.profileImage} />}
          <AvatarFallback className="text-[11px] bg-primary/15 text-primary">
            {currentUser?.full_name?.split(' ').map(n => n[0]).join('').substring(0, 2) || '?'}
          </AvatarFallback>
        </Avatar>
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="כתוב הערה..."
          className="text-sm resize-none min-h-[40px] max-h-28"
          rows={1}
        />
        <Button
          size="icon"
          onClick={handleSend}
          disabled={!newComment.trim() || sending}
          className="flex-shrink-0 h-9 w-9"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

function ChatMessage({ comment, formatTime, currentUserId }) {
  const isAutomatic = comment.type === 'automatic';
  const isMe = comment.userId === currentUserId;
  const initials = comment.userName?.split(' ').map(n => n[0]).join('').substring(0, 2) || '?';
  const label = isAutomatic ? (AUTO_EVENT_LABELS[comment.automaticEventType] || comment.comment) : comment.comment;

  if (isAutomatic) {
    const isReturned = comment.automaticEventType === 'returnedToWorker';
    return (
      <div className="flex justify-center my-1">
        {isReturned ? (
          <div className="w-full max-w-[95%] bg-orange-50 border border-orange-200 rounded-xl px-3 py-2.5">
            <div className="flex items-center gap-2 mb-1">
              <RotateCcw className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
              <span className="text-xs font-semibold text-orange-700">התקלה הוחזרה לטיפול - נדרש שיפור</span>
              <span className="text-[10px] text-orange-400 mr-auto flex-shrink-0">{formatTime(comment.created_date)}</span>
            </div>
            <p className="text-xs text-orange-800 pr-5">{comment.comment}</p>
          </div>
        ) : (
          <div className="flex items-center gap-2 bg-muted/60 border border-border/50 rounded-full px-3 py-1.5 max-w-[90%]">
            <Bot className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
            <span className="text-xs text-muted-foreground">{label}</span>
            <span className="text-[10px] text-muted-foreground/60 flex-shrink-0">{formatTime(comment.created_date)}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`flex gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
      <Avatar className="h-8 w-8 flex-shrink-0 mt-1">
        {comment.userProfileImage && <AvatarImage src={comment.userProfileImage} />}
        <AvatarFallback className="text-[11px] bg-secondary text-secondary-foreground">{initials}</AvatarFallback>
      </Avatar>
      <div className={`flex flex-col max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
        <span className="text-[11px] text-muted-foreground mb-0.5 px-1">{comment.userName}</span>
        <div className={`px-3 py-2 rounded-2xl text-sm leading-relaxed ${
          isMe ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-muted text-foreground rounded-tl-sm'
        }`}>
          {comment.comment}
        </div>
        <span className="text-[10px] text-muted-foreground/60 mt-0.5 px-1">{formatTime(comment.created_date)}</span>
      </div>
    </div>
  );
}