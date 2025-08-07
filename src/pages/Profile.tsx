import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import BlogPost from "@/components/BlogPost";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { User, Edit, Save, X, Upload, Camera } from "lucide-react";

interface Profile {
  username: string;
  full_name: string;
  bio: string;
  avatar_url?: string;
  website?: string;
}

interface Post {
  id: string;
  title: string;
  excerpt: string;
  author_id: string;
  created_at: string;
  tags: string[];
  likes_count: number;
  comments_count: number;
  featured_image?: string;
  published: boolean;
  profiles: {
    username: string;
    full_name: string;
  };
}

const Profile = () => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [drafts, setDrafts] = useState<Post[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Profile>({
    username: "",
    full_name: "",
    bio: "",
    avatar_url: "",
    website: "",
  });
  const [loading, setLoading] = useState(true);
  
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        navigate("/auth");
      } else {
        setUser(user);
        fetchProfile(user.id);
        fetchUserPosts(user.id);
      }
    });
  }, [navigate]);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setProfile(data);
        setEditForm(data);
      }
    } catch (error: any) {
      toast({
        title: "Error fetching profile",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPosts = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles!posts_author_id_fkey (
            username,
            full_name
          )
        `)
        .eq('author_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const allPosts = data || [];
      setPosts(allPosts.filter(post => post.published));
      setDrafts(allPosts.filter(post => !post.published));
    } catch (error: any) {
      toast({
        title: "Error fetching posts",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSaveProfile = async () => {
    try {
      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      let result;
      if (existingProfile) {
        // Update existing profile
        result = await supabase
          .from('profiles')
          .update({
            username: editForm.username,
            full_name: editForm.full_name,
            bio: editForm.bio,
            avatar_url: editForm.avatar_url,
            website: editForm.website,
          })
          .eq('user_id', user.id);
      } else {
        // Insert new profile
        result = await supabase
          .from('profiles')
          .insert({
            user_id: user.id,
            username: editForm.username,
            full_name: editForm.full_name,
            bio: editForm.bio,
            avatar_url: editForm.avatar_url,
            website: editForm.website,
          });
      }

      if (result.error) throw result.error;

      setProfile(editForm);
      setIsEditing(false);
      
      toast({
        title: "Profile updated!",
        description: "Your profile has been successfully updated.",
      });
    } catch (error: any) {
      toast({
        title: "Error updating profile",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Update form with new avatar URL
      setEditForm({ ...editForm, avatar_url: data.publicUrl });

      toast({
        title: "Image uploaded!",
        description: "Your avatar has been uploaded successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;

      setPosts(posts.filter(post => post.id !== postId));
      setDrafts(drafts.filter(post => post.id !== postId));
      
      toast({
        title: "Post deleted",
        description: "Your post has been deleted.",
      });
    } catch (error: any) {
      toast({
        title: "Error deleting post",
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
            <div className="h-32 bg-muted rounded"></div>
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </main>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Profile Header */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-6">
                <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center">
                  {profile?.avatar_url ? (
                    <img 
                      src={profile.avatar_url} 
                      alt={profile.full_name || profile.username}
                      className="w-24 h-24 rounded-full object-cover"
                    />
                  ) : (
                    <User className="h-12 w-12 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <h1 className="text-3xl font-bold">{profile?.full_name || "Your Name"}</h1>
                  <p className="text-muted-foreground">@{profile?.username || "username"}</p>
                  <p className="mt-2 max-w-md">{profile?.bio || "No bio yet."}</p>
                  {profile?.website && (
                    <a 
                      href={profile.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {profile.website}
                    </a>
                  )}
                </div>
              </div>
              <Button
                onClick={() => setIsEditing(!isEditing)}
                variant="outline"
              >
                {isEditing ? <X className="h-4 w-4 mr-2" /> : <Edit className="h-4 w-4 mr-2" />}
                {isEditing ? "Cancel" : "Edit Profile"}
              </Button>
            </div>
          </CardHeader>

          {isEditing && (
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Username</label>
                  <Input
                    placeholder="username"
                    value={editForm.username}
                    onChange={(e) => setEditForm({...editForm, username: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Full Name</label>
                  <Input
                    placeholder="Your full name"
                    value={editForm.full_name}
                    onChange={(e) => setEditForm({...editForm, full_name: e.target.value})}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium mb-2 block">Bio</label>
                  <Textarea
                    placeholder="Tell us about yourself..."
                    value={editForm.bio}
                    onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                    rows={3}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Avatar</label>
                  <div className="space-y-3">
                    <Input
                      placeholder="https://example.com/avatar.jpg"
                      value={editForm.avatar_url}
                      onChange={(e) => setEditForm({...editForm, avatar_url: e.target.value})}
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">or</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById('avatar-upload')?.click()}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Image
                      </Button>
                      <input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Website</label>
                  <Input
                    placeholder="https://yourwebsite.com"
                    value={editForm.website}
                    onChange={(e) => setEditForm({...editForm, website: e.target.value})}
                  />
                </div>
                <div className="md:col-span-2">
                  <Button onClick={handleSaveProfile}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Profile
                  </Button>
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Posts Tabs */}
        <Tabs defaultValue="published" className="space-y-6">
          <TabsList>
            <TabsTrigger value="published">Published Posts ({posts.length})</TabsTrigger>
            <TabsTrigger value="drafts">Drafts ({drafts.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="published" className="space-y-6">
            {posts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {posts.map((post) => (
                  <div key={post.id} className="relative">
                    <BlogPost
                      id={post.id}
                      title={post.title}
                      excerpt={post.excerpt}
                      author={post.profiles}
                      author_id={post.author_id}
                      created_at={post.created_at}
                      tags={post.tags}
                      likes_count={post.likes_count}
                      comments_count={post.comments_count}
                      featured_image={post.featured_image}
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => handleDeletePost(post.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <h3 className="text-xl font-semibold mb-4">No published posts yet</h3>
                <p className="text-muted-foreground mb-4">Start writing and share your thoughts with the world!</p>
                <Button onClick={() => navigate("/create")}>Create Your First Post</Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="drafts" className="space-y-6">
            {drafts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {drafts.map((post) => (
                  <div key={post.id} className="relative">
                    <BlogPost
                      id={post.id}
                      title={post.title}
                      excerpt={post.excerpt}
                      author={post.profiles}
                      author_id={post.author_id}
                      created_at={post.created_at}
                      tags={post.tags}
                      likes_count={post.likes_count}
                      comments_count={post.comments_count}
                      featured_image={post.featured_image}
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => handleDeletePost(post.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <h3 className="text-xl font-semibold mb-4">No drafts</h3>
                <p className="text-muted-foreground">All your unpublished posts will appear here.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Profile;