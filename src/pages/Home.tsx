import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import BlogPost from "@/components/BlogPost";
import Newsletter from "@/components/Newsletter";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, TrendingUp, Clock, Users, BookOpen, Star, ArrowRight, Sparkles } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface Post {
  id: string;
  title: string;
  excerpt: string;
  author_id: string;
  created_at: string;
  tags: string[];
  likes_count: number;
  comments_count: number;
  views_count: number;
  featured_image?: string;
  profiles: {
    username: string;
    full_name: string;
  };
}

const Home = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"latest" | "popular">("latest");
  const [layoutTemplate, setLayoutTemplate] = useState("grid");
  const { toast } = useToast();

  useEffect(() => {
    fetchPosts();
  }, [sortBy]);

  useEffect(() => {
    // Load saved layout preference
    const savedLayout = localStorage.getItem("blaze-layout-template");
    if (savedLayout) {
      setLayoutTemplate(savedLayout);
    }

    // Listen for layout changes from themes page
    const handleLayoutChange = (event: CustomEvent) => {
      setLayoutTemplate(event.detail);
    };

    window.addEventListener("layoutChange", handleLayoutChange as EventListener);
    return () => window.removeEventListener("layoutChange", handleLayoutChange as EventListener);
  }, []);

  const fetchPosts = async () => {
    try {
      let query = supabase
        .from('posts')
        .select(`
          id,
          title,
          excerpt,
          author_id,
          created_at,
          tags,
          likes_count,
          comments_count,
          views_count,
          featured_image,
          profiles!posts_author_id_fkey (
            username,
            full_name
          )
        `)
        .eq('published', true);

      if (sortBy === "latest") {
        query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query;

      if (error) throw error;
      setPosts(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching posts",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredPosts = posts.filter(post => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    
    // Check if search term matches any tag exactly or partially
    const tagMatch = post.tags.some(tag => 
      tag.toLowerCase() === searchLower || 
      tag.toLowerCase().includes(searchLower)
    );
    
    // Also check title and excerpt for general search
    const titleMatch = post.title.toLowerCase().includes(searchLower);
    const excerptMatch = post.excerpt.toLowerCase().includes(searchLower);
    
    return tagMatch || titleMatch || excerptMatch;
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Enhanced Hero Section */}
        <div className="text-center mb-16 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-3xl -z-10"></div>
          <div className="py-16 px-8">
            <div className="flex justify-center mb-6">
              <Badge variant="secondary" className="px-4 py-2 text-sm font-medium">
                <Sparkles className="h-4 w-4 mr-2" />
                Welcome to the Future of Blogging
              </Badge>
            </div>
            <h1 className="text-4xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-primary/80 to-secondary bg-clip-text text-transparent leading-tight">
              Blaze Blog
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-8 leading-relaxed">
              Discover amazing stories, insights, and ideas from our community of passionate writers. 
              Join thousands of readers exploring diverse perspectives.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="px-8 py-3">
                <BookOpen className="h-5 w-5 mr-2" />
                Start Reading
              </Button>
              <Button variant="outline" size="lg" className="px-8 py-3">
                <Users className="h-5 w-5 mr-2" />
                Join Community
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-center mb-2">
                <div className="p-3 bg-primary/10 rounded-full">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold">{posts.length}+</CardTitle>
              <CardDescription>Amazing Stories</CardDescription>
            </CardHeader>
          </Card>
          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-center mb-2">
                <div className="p-3 bg-secondary/10 rounded-full">
                  <Users className="h-6 w-6 text-secondary" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold">1000+</CardTitle>
              <CardDescription>Active Readers</CardDescription>
            </CardHeader>
          </Card>
          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-center mb-2">
                <div className="p-3 bg-accent/10 rounded-full">
                  <Star className="h-6 w-6 text-accent" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold">4.9</CardTitle>
              <CardDescription>Average Rating</CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Featured Categories */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Trending Topics</h2>
            <Button variant="ghost" className="text-primary">
              View All <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-3">
            {["Technology", "Health", "Business", "Lifestyle", "Travel", "Food", "Science", "Art"].map((category) => (
              <Badge 
                key={category} 
                variant="secondary" 
                className="px-4 py-2 hover:bg-primary hover:text-primary-foreground cursor-pointer transition-colors"
                onClick={() => setSearchTerm(category.toLowerCase())}
              >
                {category}
              </Badge>
            ))}
          </div>
        </div>

        {/* Enhanced Search and Filters */}
        <div className="mb-12">
          <div className="bg-card rounded-xl p-6 border shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Find Your Perfect Read</h3>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search posts, authors, or topics..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-12"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={sortBy === "latest" ? "default" : "outline"}
                  onClick={() => setSortBy("latest")}
                  className="h-12 px-6"
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Latest
                </Button>
                <Button
                  variant={sortBy === "popular" ? "default" : "outline"}
                  onClick={() => setSortBy("popular")}
                  className="h-12 px-6"
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Popular
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Posts Section */}
        <div className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold">Latest Stories</h2>
            <div className="text-sm text-muted-foreground">
              {filteredPosts.length} {filteredPosts.length === 1 ? 'post' : 'posts'} found
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <div className="aspect-video bg-muted rounded-t-lg"></div>
                  <CardHeader>
                    <div className="bg-muted h-4 rounded mb-2"></div>
                    <div className="bg-muted h-4 rounded w-3/4"></div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : filteredPosts.length > 0 ? (
            <div className={`posts-container ${
              layoutTemplate === "magazine" && filteredPosts.length > 0 ? "" : 
              layoutTemplate === "list" ? "flex flex-col gap-6" :
              "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            }`}>
              {layoutTemplate === "magazine" && filteredPosts.length > 0 ? (
                <>
                  {/* Featured Post */}
                  <div className="featured-post">
                    <div className="group hover:scale-105 transition-transform duration-200">
                      <BlogPost
                        id={filteredPosts[0].id}
                        title={filteredPosts[0].title}
                        excerpt={filteredPosts[0].excerpt}
                        author={filteredPosts[0].profiles}
                        author_id={filteredPosts[0].author_id}
                        created_at={filteredPosts[0].created_at}
                        tags={filteredPosts[0].tags}
                        likes_count={filteredPosts[0].likes_count}
                        comments_count={filteredPosts[0].comments_count}
                        views_count={filteredPosts[0].views_count}
                        featured_image={filteredPosts[0].featured_image}
                      />
                    </div>
                  </div>
                  {/* Sidebar Posts */}
                  <div className="sidebar-posts">
                    {filteredPosts.slice(1, 5).map((post) => (
                      <div key={post.id} className="group hover:scale-105 transition-transform duration-200">
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
                          views_count={post.views_count}
                          featured_image={post.featured_image}
                        />
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                filteredPosts.map((post) => (
                  <div 
                    key={post.id} 
                    className={`group hover:scale-105 transition-transform duration-200 ${
                      layoutTemplate === "list" ? "post-card flex flex-row items-center gap-6 p-6 bg-card rounded-lg border" : ""
                    }`}
                  >
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
                      views_count={post.views_count}
                      featured_image={post.featured_image}
                    />
                  </div>
                ))
              )}
            </div>
          ) : (
            <Card className="text-center py-16">
              <CardContent className="space-y-4">
                <div className="flex justify-center">
                  <div className="p-4 bg-muted rounded-full">
                    <BookOpen className="h-8 w-8 text-muted-foreground" />
                  </div>
                </div>
                <h3 className="text-2xl font-semibold">No posts found</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  {searchTerm ? "Try adjusting your search terms or explore different categories." : "Be the first to share your story with our community!"}
                </p>
                {!searchTerm && (
                  <Button className="mt-4">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Write Your First Post
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Newsletter Subscription */}
        <div className="max-w-2xl mx-auto">
          <Newsletter />
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Home;