import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { Comment } from "@/hooks/useComments";
import { Edit, Trash2, Reply, MoreVertical, Send, X, ChevronDown, ChevronUp } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import CommentForm from "./CommentForm";

interface CommentItemProps {
  comment: Comment;
  onEdit: (commentId: string, newContent: string) => Promise<boolean>;
  onDelete: (commentId: string) => Promise<boolean>;
  onReply: (content: string, parentId: string) => Promise<boolean>;
  isSubmitting: boolean;
  level?: number;
}

const CommentItem = ({ 
  comment, 
  onEdit, 
  onDelete, 
  onReply, 
  isSubmitting,
  level = 0 
}: CommentItemProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [showReplies, setShowReplies] = useState(false);
  const { user } = useAuth();
  
  const isOwner = user?.id === comment.user_id;
  const maxLevel = 3; // Maximum reply nesting level
  const hasReplies = comment.replies && comment.replies.length > 0;

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = diffInMs / (1000 * 60 * 60);
    const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      return `${diffInMinutes} menit yang lalu`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} jam yang lalu`;
    } else if (diffInDays < 7) {
      return `${Math.floor(diffInDays)} hari yang lalu`;
    } else {
      return date.toLocaleDateString('id-ID', { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric' 
      });
    }
  };

  const handleEdit = async () => {
    if (!editContent.trim()) return;
    
    const success = await onEdit(comment.id, editContent.trim());
    if (success) {
      setIsEditing(false);
    }
  };

  const handleDelete = async () => {
    await onDelete(comment.id);
  };

  const handleReply = async (content: string) => {
    const success = await onReply(content, comment.id);
    if (success) {
      setIsReplying(false);
    }
    return success;
  };

  const getUserInitials = (username: string) => {
    return username.slice(0, 2).toUpperCase();
  };

  return (
    <div className={`space-y-2 ${level > 0 ? 'ml-6' : ''}`}>
      <div className="bg-card/30 backdrop-blur-sm border border-border/50 rounded-lg p-3">
        {/* Comment Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <Avatar className="w-6 h-6">
              <AvatarImage src={comment.profiles?.avatar_url} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                {getUserInitials(comment.profiles?.username || 'User')}
              </AvatarFallback>
            </Avatar>
            <div>
              <h4 className="font-semibold text-white text-xs">
                @{comment.profiles?.username || 'Unknown User'}
              </h4>
              <p className="text-xs text-muted-foreground">
                {formatTimeAgo(comment.created_at)}
                {comment.is_edited && ' • diedit'}
              </p>
            </div>
          </div>
          
          {isOwner && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <MoreVertical className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsEditing(true)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem 
                      className="text-destructive focus:text-destructive"
                      onSelect={(e) => e.preventDefault()}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Hapus
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Hapus Komentar</AlertDialogTitle>
                      <AlertDialogDescription>
                        Apakah Anda yakin ingin menghapus komentar ini? Tindakan ini tidak dapat dibatalkan.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Batal</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Hapus
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Comment Content */}
        {isEditing ? (
          <div className="space-y-2">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="min-h-[40px] bg-muted/30 border-muted focus:border-primary transition-colors"
              disabled={isSubmitting}
              rows={2}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleEdit} disabled={isSubmitting || !editContent.trim()} className="h-7 px-2 text-xs">
                <Send className="w-3 h-3 mr-1" />
                Simpan
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => {
                  setIsEditing(false);
                  setEditContent(comment.content);
                }}
                disabled={isSubmitting}
                className="h-7 px-2 text-xs"
              >
                <X className="w-3 h-3 mr-1" />
                Batal
              </Button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-white text-sm leading-snug mb-2 whitespace-pre-wrap">
              {comment.content}
            </p>
            
            {/* Comment Actions */}
            <div className="flex items-center gap-1">
              {level < maxLevel && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setIsReplying(!isReplying)}
                  className="h-6 px-2 text-xs text-muted-foreground hover:text-primary"
                >
                  <Reply className="w-3 h-3 mr-1" />
                  Balas
                </Button>
              )}
              {hasReplies && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowReplies(!showReplies)}
                  className="h-6 px-2 text-xs text-muted-foreground hover:text-primary"
                >
                  {showReplies ? (
                    <>
                      <ChevronUp className="w-3 h-3 mr-1" />
                      Sembunyikan balasan
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3 h-3 mr-1" />
                      Lihat {comment.replies?.length} balasan
                    </>
                  )}
                </Button>
              )}
            </div>
          </>
        )}
      </div>

      {/* Reply Form */}
      {isReplying && (
        <div className="ml-3">
          <CommentForm
            onSubmit={handleReply}
            isSubmitting={isSubmitting}
            placeholder="Tulis balasan Anda..."
            buttonText="Balas"
            parentId={comment.id}
          />
        </div>
      )}

      {/* Replies */}
      {showReplies && hasReplies && (
        <div className="space-y-2">
          {comment.replies!.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              onEdit={onEdit}
              onDelete={onDelete}
              onReply={onReply}
              isSubmitting={isSubmitting}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentItem;