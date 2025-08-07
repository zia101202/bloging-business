import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ThemesAndTemplates } from "@/components/ThemesAndTemplates";

const ThemesTemplatesPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <ThemesAndTemplates />
      </main>
      <Footer />
    </div>
  );
};

export default ThemesTemplatesPage;