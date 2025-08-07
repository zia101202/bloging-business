import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Palette, Layout, Check, Sparkles, Monitor, Smartphone, Grid, List, LayoutGrid } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

interface ColorTheme {
  id: string;
  name: string;
  description: string;
  primary: string;
  secondary: string;
  accent: string;
  preview: string[];
}

interface LayoutTemplate {
  id: string;
  name: string;
  description: string;
  icon: any;
  preview: string;
}

const colorThemes: ColorTheme[] = [
  {
    id: "default",
    name: "Classic",
    description: "Clean and professional",
    primary: "hsl(222.2, 84%, 4.9%)",
    secondary: "hsl(210, 40%, 96%)",
    accent: "hsl(210, 40%, 98%)",
    preview: ["#0f172a", "#f1f5f9", "#f8fafc"]
  },
  {
    id: "ocean",
    name: "Ocean Blue",
    description: "Calm and refreshing",
    primary: "hsl(200, 85%, 35%)",
    secondary: "hsl(200, 50%, 90%)",
    accent: "hsl(200, 80%, 95%)",
    preview: ["#0369a1", "#dbeafe", "#eff6ff"]
  },
  {
    id: "forest",
    name: "Forest Green",
    description: "Natural and serene",
    primary: "hsl(120, 60%, 25%)",
    secondary: "hsl(120, 30%, 90%)",
    accent: "hsl(120, 40%, 95%)",
    preview: ["#166534", "#dcfce7", "#f0fdf4"]
  },
  {
    id: "sunset",
    name: "Sunset Orange",
    description: "Warm and energetic",
    primary: "hsl(25, 85%, 45%)",
    secondary: "hsl(25, 50%, 90%)",
    accent: "hsl(25, 60%, 95%)",
    preview: ["#ea580c", "#fed7aa", "#fff7ed"]
  },
  {
    id: "purple",
    name: "Royal Purple",
    description: "Elegant and creative",
    primary: "hsl(270, 70%, 40%)",
    secondary: "hsl(270, 30%, 90%)",
    accent: "hsl(270, 40%, 95%)",
    preview: ["#7c3aed", "#e9d5ff", "#faf5ff"]
  }
];

const layoutTemplates: LayoutTemplate[] = [
  {
    id: "grid",
    name: "Grid Layout",
    description: "Card-based grid view",
    icon: Grid,
    preview: "Standard card grid with 3 columns"
  },
  {
    id: "list",
    name: "List Layout",
    description: "Compact list view",
    icon: List,
    preview: "Horizontal list with thumbnails"
  },
  {
    id: "magazine",
    name: "Magazine Style",
    description: "Featured post layout",
    icon: LayoutGrid,
    preview: "Large featured posts with sidebar"
  }
];

export function ThemesAndTemplates() {
  const { theme, setTheme } = useTheme();
  const [selectedColorTheme, setSelectedColorTheme] = useState("default");
  const [selectedLayout, setSelectedLayout] = useState("grid");

  useEffect(() => {
    // Load saved preferences
    const savedColorTheme = localStorage.getItem("blaze-color-theme");
    const savedLayout = localStorage.getItem("blaze-layout-template");
    
    if (savedColorTheme) {
      setSelectedColorTheme(savedColorTheme);
      applyColorTheme(savedColorTheme);
    }
    if (savedLayout) {
      setSelectedLayout(savedLayout);
      applyLayoutTemplate(savedLayout);
    }
  }, []);

  const applyColorTheme = (themeId: string) => {
    const colorTheme = colorThemes.find(t => t.id === themeId);
    if (!colorTheme) return;

    setSelectedColorTheme(themeId);
    localStorage.setItem("blaze-color-theme", themeId);

    // Apply CSS variables to root
    const root = document.documentElement;
    if (themeId !== "default") {
      // Extract HSL values without the hsl() wrapper
      const primaryHSL = colorTheme.primary.replace("hsl(", "").replace(")", "");
      const secondaryHSL = colorTheme.secondary.replace("hsl(", "").replace(")", "");
      const accentHSL = colorTheme.accent.replace("hsl(", "").replace(")", "");
      
      root.style.setProperty("--primary", primaryHSL);
      root.style.setProperty("--secondary", secondaryHSL);
      root.style.setProperty("--accent", accentHSL);
    } else {
      // Reset to default values from index.css
      root.style.setProperty("--primary", "222.2 47.4% 11.2%");
      root.style.setProperty("--secondary", "210 40% 96.1%");
      root.style.setProperty("--accent", "210 40% 96.1%");
    }
  };

  const applyLayoutTemplate = (templateId: string) => {
    setSelectedLayout(templateId);
    localStorage.setItem("blaze-layout-template", templateId);
    
    // Apply layout class to body
    const body = document.body;
    // Remove previous layout classes
    body.classList.remove("layout-grid", "layout-list", "layout-magazine");
    // Add new layout class
    body.classList.add(`layout-${templateId}`);
    
    // Dispatch custom event to update layout
    window.dispatchEvent(new CustomEvent("layoutChange", { detail: templateId }));
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-primary/10 rounded-full">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
        </div>
        <h1 className="text-3xl font-bold mb-2">Themes & Templates</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Customize your reading experience with beautiful themes and layouts. 
          Choose from our curated collection of color schemes and page templates.
        </p>
      </div>

      <Tabs defaultValue="themes" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="themes" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Color Themes
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <Layout className="h-4 w-4" />
            Layout Templates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="themes" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {colorThemes.map((colorTheme) => (
              <Card 
                key={colorTheme.id}
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  selectedColorTheme === colorTheme.id ? "ring-2 ring-primary" : ""
                }`}
                onClick={() => applyColorTheme(colorTheme.id)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{colorTheme.name}</CardTitle>
                    {selectedColorTheme === colorTheme.id && (
                      <Badge variant="default" className="px-2 py-1">
                        <Check className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
                    )}
                  </div>
                  <CardDescription>{colorTheme.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex space-x-2 mb-4">
                    {colorTheme.preview.map((color, index) => (
                      <div
                        key={index}
                        className="w-8 h-8 rounded-full border-2 border-background shadow-sm"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <Button 
                    variant={selectedColorTheme === colorTheme.id ? "default" : "outline"}
                    size="sm"
                    className="w-full"
                  >
                    {selectedColorTheme === colorTheme.id ? "Applied" : "Apply Theme"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {layoutTemplates.map((template) => {
              const IconComponent = template.icon;
              return (
                <Card 
                  key={template.id}
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    selectedLayout === template.id ? "ring-2 ring-primary" : ""
                  }`}
                  onClick={() => applyLayoutTemplate(template.id)}
                >
                  <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                      <div className={`p-4 rounded-full ${
                        selectedLayout === template.id ? "bg-primary text-primary-foreground" : "bg-muted"
                      }`}>
                        <IconComponent className="h-8 w-8" />
                      </div>
                    </div>
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <CardDescription>{template.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground mb-4 text-center">
                      {template.preview}
                    </div>
                    <Button 
                      variant={selectedLayout === template.id ? "default" : "outline"}
                      size="sm"
                      className="w-full"
                    >
                      {selectedLayout === template.id ? (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Applied
                        </>
                      ) : (
                        "Apply Layout"
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-primary/10 rounded-full">
              <Monitor className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold">Responsive Design</h4>
              <p className="text-sm text-muted-foreground">
                All themes and templates are fully responsive and optimized for mobile devices.
              </p>
            </div>
            <Smartphone className="h-8 w-8 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}