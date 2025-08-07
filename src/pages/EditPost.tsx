import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { PenTool, X, Save, Eye, ArrowLeft } from "lucide-react";
import RichTextEditor from "@/components/RichTextEditor";
import { Link } from "react-router-dom";

const EditPost = () => {
  const { id } = useParams();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [featuredImage, setFeaturedImage] = useState("");
  const [published, setPublished] = useState(false);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [postLoading, setPostLoading] = useState(true);
  
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        navigate("/auth");
      } else {
        setUser(user);
        fetchPost(user.id);
      }
    });
  }, [navigate, id]);

  const fetchPost = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('id', id)
        .eq('author_id', userId)
        .single();

      if (error) throw error;

      setTitle(data.title);
      setContent(data.content);
      setExcerpt(data.excerpt || "");
      setTags(data.tags || []);
      setFeaturedImage(data.featured_image || "");
      setPublished(data.published);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load post or you don't have permission to edit it.",
        variant: "destructive",
      });
      navigate("/");
    } finally {
      setPostLoading(false);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = async (shouldPublish: boolean) => {
    if (!title.trim() || !content.trim()) {
      toast({
        title: "Missing fields",
        description: "Title and content are required.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('posts')
        .update({
          title,
          content,
          excerpt: excerpt || content.substring(0, 200) + "...",
          published: shouldPublish,
          featured_image: featuredImage || null,
          tags,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('author_id', user.id);

      if (error) throw error;

      toast({
        title: shouldPublish ? "Post updated and published!" : "Post updated as draft!",
        description: shouldPublish ? "Your changes are now live." : "Your draft has been saved.",
      });

      navigate(`/post/${id}`);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user || postLoading) {
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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Link to={`/post/${id}`} className="inline-flex items-center gap-2 mb-6 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to Post
        </Link>

        <div className="flex items-center gap-2 mb-8">
          <PenTool className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold">Edit Post</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content area */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Post Content</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Title</label>
                  <Input
                    placeholder="Enter your post title..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Excerpt (Optional)</label>
                  <RichTextEditor
                    content={excerpt}
                    onChange={setExcerpt}
                    placeholder="Brief description of your post..."
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Content</label>
                  <RichTextEditor
                    content={content}
                    onChange={setContent}
                    placeholder="Write your post content here..."
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Post Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Featured Image URL</label>
                  <Input
                    placeholder="https://example.com/image.jpg"
                    value={featuredImage}
                    onChange={(e) => setFeaturedImage(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Tags</label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      placeholder="Add a tag..."
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addTag()}
                    />
                    <Button onClick={addTag} size="sm">Add</Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                        {tag}
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => removeTag(tag)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-4">
                  <Button
                    onClick={() => handleSubmit(false)}
                    variant="outline"
                    disabled={loading}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save as Draft
                  </Button>
                  <Button
                    onClick={() => handleSubmit(true)}
                    disabled={loading}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    {published ? "Update & Publish" : "Publish Post"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default EditPost;