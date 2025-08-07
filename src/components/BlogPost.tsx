import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Calendar, User, Edit, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useState, useEffect } from "react";

interface BlogPostProps {
  id: string;
  title: string;
  excerpt: string;
  author: {
    username: string;
    full_name: string;
  };
  author_id: string;
  created_at: string;
  tags: string[];
  likes_count?: number;
  comments_count?: number;
  views_count?: number;
  featured_image?: string;
}

const BlogPost = ({ 
  id, 
  title, 
  excerpt, 
  author, 
  author_id,
  created_at, 
  tags, 
  likes_count = 0, 
  comments_count = 0,
  views_count = 0,
  featured_image 
}: BlogPostProps) => {
  const [currentLikesCount, setCurrentLikesCount] = useState(likes_count);
  const [isLiked, setIsLiked] = useState(false);
  const [user, setUser] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) {
        checkIfLiked(user.id);
      }
    });
  }, []);

  const checkIfLiked = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('likes')
        .select('id')
        .eq('post_id', id)
        .eq('user_id', userId)
        .maybeSingle();
      
      setIsLiked(!!data);
    } catch (error) {
      console.error('Error checking like status:', error);
    }
  };

  const handleLike = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "You need to sign in to like posts.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (isLiked) {
        // Unlike the post
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('post_id', id)
          .eq('user_id', user.id);
        
        if (!error) {
          const newCount = Math.max(0, currentLikesCount - 1);
          setIsLiked(false);
          setCurrentLikesCount(newCount);
          
          // Update the posts table likes_count
          await supabase
            .from('posts')
            .update({ likes_count: newCount })
            .eq('id', id);
        }
      } else {
        // Like the post
        const { error } = await supabase
          .from('likes')
          .insert({ post_id: id, user_id: user.id });
        
        if (!error) {
          const newCount = currentLikesCount + 1;
          setIsLiked(true);
          setCurrentLikesCount(newCount);
          
          // Update the posts table likes_count
          await supabase
            .from('posts')
            .update({ likes_count: newCount })
            .eq('id', id);
        }
      }
    } catch (error: any) {
      console.error('Like error:', error);
      toast({
        title: "Error",
        description: "Failed to update like status.",
        variant: "destructive",
      });
    }
  };
  return (
    <Card className="hover:shadow-lg transition-shadow">
      {featured_image && (
        <div className="aspect-video w-full overflow-hidden rounded-t-lg">
          <img 
            src={featured_image} 
            alt={title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <CardHeader>
        <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-2">
          <User className="h-4 w-4" />
          <span>{author.full_name || author.username}</span>
          <Calendar className="h-4 w-4 ml-4" />
          <span>{format(new Date(created_at), 'MMM dd, yyyy')}</span>
        </div>
        <Link to={`/post/${id}`}>
          <h2 className="text-xl font-semibold hover:text-primary transition-colors line-clamp-2">
            {title}
          </h2>
        </Link>
      </CardHeader>
      <CardContent>
        <div 
          className="text-muted-foreground mb-4 line-clamp-3 prose prose-sm dark:prose-invert" 
          dangerouslySetInnerHTML={{ __html: excerpt }} 
        />
        
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {tags.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <button
              onClick={handleLike}
              className="flex items-center space-x-1 hover:text-primary transition-colors"
            >
              <Heart className={`h-4 w-4 ${isLiked ? 'fill-primary text-primary' : ''}`} />
              <span>{currentLikesCount}</span>
            </button>
            <div className="flex items-center space-x-1">
              <MessageCircle className="h-4 w-4" />
              <span>{comments_count}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Eye className="h-4 w-4" />
              <span>{views_count}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {user?.id === author_id && (
              <Link to={`/edit-post/${id}`}>
                <Button variant="ghost" size="sm">
                  <Edit className="h-4 w-4" />
                </Button>
              </Link>
            )}
            <Link to={`/post/${id}`}>
              <Button variant="outline" size="sm">
                Read More
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BlogPost;