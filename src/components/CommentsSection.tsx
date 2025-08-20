import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useComments } from "@/hooks/useComments";
import CommentForm from "./CommentForm";
import CommentItem from "./CommentItem";

interface CommentsSectionProps {
  videoId: string;
}

const CommentsSection = ({ videoId }: CommentsSectionProps) => {
  const { 
    comments, 
    isLoading, 
    isSubmitting, 
    addComment, 
    editComment, 
    deleteComment 
  } = useComments({ videoId });
  
  const [visibleComments, setVisibleComments] = useState(3);
  
  const displayedComments = comments.slice(0, visibleComments);
  const hasMoreComments = comments.length > visibleComments;

  const handleAddComment = async (content: string) => {
    return await addComment(content);
  };

  const handleReply = async (content: string, parentId: string) => {
    return await addComment(content, parentId);
  };

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <MessageCircle className="w-5 h-5" />
          Komentar ({comments.length})
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Comment Form */}
        <CommentForm
          onSubmit={handleAddComment}
          isSubmitting={isSubmitting}
        />
        
        <Separator className="bg-border/50" />
        
        {/* Comments List */}
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3"></div>
            <p className="text-muted-foreground">Memuat komentar...</p>
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-white mb-2">
              Belum Ada Komentar
            </h3>
            <p className="text-muted-foreground">
              Jadilah yang pertama mengomentari video ini!
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {displayedComments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                onEdit={editComment}
                onDelete={deleteComment}
                onReply={handleReply}
                isSubmitting={isSubmitting}
              />
            ))}
            {hasMoreComments && (
              <div className="text-center pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setVisibleComments(prev => prev + 5)}
                  className="text-sm"
                >
                  Lihat {Math.min(5, comments.length - visibleComments)} komentar lainnya
                </Button>
              </div>
            )}
            {visibleComments > 3 && (
              <div className="text-center pt-2">
                <Button 
                  variant="ghost" 
                  onClick={() => setVisibleComments(3)}
                  className="text-sm text-muted-foreground hover:text-primary"
                >
                  Lihat lebih sedikit
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CommentsSection;