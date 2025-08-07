import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { Heart, MessageCircle, User, Calendar, ArrowLeft, Eye } from "lucide-react";

interface Post {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  created_at: string;
  tags: string[];
  likes_count: number;
  comments_count: number;
  views_count: number;
  featured_image?: string;
  profiles: {
    username: string;
    full_name: string;
    bio: string;
    avatar_url?: string;
  };
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  profiles: {
    username: string;
    full_name: string;
    avatar_url?: string;
  };
}

const PostDetail = () => {
  const { id } = useParams();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [currentLikesCount, setCurrentLikesCount] = useState(0);
  const [currentCommentsCount, setCurrentCommentsCount] = useState(0);
  const [currentViewsCount, setCurrentViewsCount] = useState(0);
  
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
    fetchPost();
    fetchComments();
  }, [id]);

  useEffect(() => {
    if (user && post) {
      checkIfLiked();
    }
  }, [user, post]);

  const fetchPost = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles!posts_author_id_fkey (
            username,
            full_name,
            bio,
            avatar_url
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setPost(data);
      setCurrentLikesCount(data.likes_count || 0);
      setCurrentCommentsCount(data.comments_count || 0);
      setCurrentViewsCount(data.views_count || 0);
      
      // Track the view
      if (user) {
        trackView(data.id, user.id);
      } else {
        trackView(data.id);
      }
    } catch (error: any) {
      toast({
        title: "Error fetching post",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const checkIfLiked = async () => {
    if (!user || !id) return;
    
    try {
      const { data } = await supabase
        .from('likes')
        .select('id')
        .eq('post_id', id)
        .eq('user_id', user.id)
        .maybeSingle();
      
      setIsLiked(!!data);
    } catch (error) {
      console.error('Error checking like status:', error);
    }
  };

  const trackView = async (postId: string, userId?: string) => {
    try {
      const { data } = await supabase.rpc('increment_post_views', {
        post_uuid: postId,
        viewer_id: userId || null,
        viewer_ip: null, // Could be implemented with IP detection
        viewer_agent: navigator.userAgent
      });
      
      if (data) {
        setCurrentViewsCount(data);
      }
    } catch (error) {
      console.error('Error tracking view:', error);
    }
  };

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          profiles!comments_author_id_fkey (
            username,
            full_name,
            avatar_url
          )
        `)
        .eq('post_id', id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments(data || []);
    } catch (error: any) {
      console.error('Error fetching comments:', error);
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
      toast({
        title: "Error",
        description: "Failed to update like status.",
        variant: "destructive",
      });
    }
  };

  const handleComment = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "You need to sign in to comment.",
        variant: "destructive",
      });
      return;
    }

    if (!newComment.trim()) return;

    try {
      const { error } = await supabase
        .from('comments')
        .insert({
          post_id: id,
          author_id: user.id,
          content: newComment.trim(),
        });

      if (error) throw error;

      const newCount = currentCommentsCount + 1;
      setCurrentCommentsCount(newCount);
      setNewComment("");
      fetchComments();
      
      // Update comments count in posts table
      await supabase
        .from('posts')
        .update({ comments_count: newCount })
        .eq('id', id);
      
      toast({
        title: "Comment added!",
        description: "Your comment has been posted.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="h-64 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </main>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Post not found</h1>
            <Link to="/">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Link to="/" className="inline-flex items-center gap-2 mb-6 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to Posts
        </Link>

        <article className="space-y-8">
          {/* Featured Image */}
          {post.featured_image && (
            <div className="aspect-video w-full overflow-hidden rounded-lg">
              <img 
                src={post.featured_image} 
                alt={post.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Post Header */}
          <div className="space-y-4">
            <h1 className="text-4xl font-bold">{post.title}</h1>
            
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center space-x-4 text-muted-foreground">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span>{post.profiles.full_name || post.profiles.username}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4" />
                  <span>{format(new Date(post.created_at), 'MMM dd, yyyy')}</span>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <Button
                  variant={isLiked ? "default" : "outline"}
                  size="sm"
                  onClick={handleLike}
                >
                  <Heart className={`h-4 w-4 mr-2 ${isLiked ? 'fill-current' : ''}`} />
                  {currentLikesCount}
                </Button>
                <div className="flex items-center space-x-1 text-muted-foreground">
                  <MessageCircle className="h-4 w-4" />
                  <span>{currentCommentsCount}</span>
                </div>
                <div className="flex items-center space-x-1 text-muted-foreground">
                  <Eye className="h-4 w-4" />
                  <span>{currentViewsCount}</span>
                </div>
              </div>
            </div>

            {/* Tags */}
            {post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Post Content */}
          <div className="prose prose-lg max-w-none dark:prose-invert">
            <div dangerouslySetInnerHTML={{ __html: post.content }} />
          </div>

          {/* Author Bio */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">About the Author</h3>
            </CardHeader>
            <CardContent>
              <div className="flex items-start space-x-4">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                  {post.profiles.avatar_url ? (
                    <img 
                      src={post.profiles.avatar_url} 
                      alt={post.profiles.full_name || post.profiles.username}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <User className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <h4 className="font-semibold">{post.profiles.full_name || post.profiles.username}</h4>
                  <p className="text-muted-foreground">{post.profiles.bio || "No bio available."}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Comments Section */}
          <div className="space-y-6">
            <h3 className="text-2xl font-bold">Comments ({comments.length})</h3>

            {/* Add Comment */}
            {user ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <Textarea
                      placeholder="Share your thoughts..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      rows={3}
                    />
                    <Button onClick={handleComment} disabled={!newComment.trim()}>
                      Post Comment
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-muted-foreground mb-4">Sign in to join the conversation</p>
                  <Link to="/auth">
                    <Button>Sign In</Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            {/* Comments List */}
            <div className="space-y-4">
              {comments.map((comment) => (
                <Card key={comment.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start space-x-4">
                      <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
                        {comment.profiles.avatar_url ? (
                          <img 
                            src={comment.profiles.avatar_url} 
                            alt={comment.profiles.full_name || comment.profiles.username}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <User className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="font-semibold">{comment.profiles.full_name || comment.profiles.username}</span>
                          <span className="text-muted-foreground text-sm">
                            {format(new Date(comment.created_at), 'MMM dd, yyyy')}
                          </span>
                        </div>
                        <p className="text-muted-foreground">{comment.content}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </article>
      </main>
    </div>
  );
};

export default PostDetail;