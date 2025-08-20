import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { MessageCircle, Send } from "lucide-react";

interface CommentFormProps {
  onSubmit: (content: string) => Promise<boolean>;
  isSubmitting: boolean;
  placeholder?: string;
  buttonText?: string;
  parentId?: string;
}

const CommentForm = ({ 
  onSubmit, 
  isSubmitting, 
  placeholder = "Tulis komentar Anda...",
  buttonText = "Kirim Komentar",
  parentId
}: CommentFormProps) => {
  const [content, setContent] = useState("");
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) return;
    
    const success = await onSubmit(content.trim());
    if (success) {
      setContent("");
    }
  };

  if (!user) {
    return (
      <div className="bg-card/30 backdrop-blur-sm border border-border/50 rounded-lg p-4 text-center">
        <MessageCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
        <h3 className="text-sm font-semibold text-white mb-1">
          Login untuk Berkomentar
        </h3>
        <p className="text-xs text-muted-foreground mb-3">
          Bergabunglah dengan diskusi dan bagikan pendapat Anda tentang video ini.
        </p>
        <div className="flex gap-2 justify-center">
          <Link to="/login">
            <Button variant="hero" size="sm" className="text-xs px-3 py-1 h-7">
              Masuk
            </Button>
          </Link>
          <Link to="/register">
            <Button variant="outline" size="sm" className="text-xs px-3 py-1 h-7">
              Daftar
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={placeholder}
          className="min-h-[60px] bg-muted/30 border-muted focus:border-primary transition-colors resize-none"
          disabled={isSubmitting}
        />
      </div>
      
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          {content.length}/500 karakter
        </p>
        <Button 
          type="submit" 
          disabled={!content.trim() || isSubmitting || content.length > 500}
          className="gap-2"
        >
          <Send className="w-4 h-4" />
          {isSubmitting ? "Mengirim..." : buttonText}
        </Button>
      </div>
    </form>
  );
};

export default CommentForm;