import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Hero = () => {
  const navigate = useNavigate();

  const handleStartCreating = () => {
    navigate("/Dashboard");
  };

  return (
    <section className="min-h-screen bg-gradient-hero relative overflow-hidden">
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-background/50 via-transparent to-primary/10"></div>

      {/* Content */}
      <div className="relative container mx-auto px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm mb-8">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
            <span className="text-sm text-primary font-medium">AI Powered Website Builder</span>
          </div>

          {/* Main heading */}
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-foreground via-primary to-primary-glow bg-clip-text text-transparent">
            Create Stunning <span className="text-primary">Websites</span> with AI
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
            Transform your ideas into beautiful, responsive websites using simple text prompts. No 
            coding required – just describe what you want and watch it come to life.
          </p>

          {/* CTA Button */}
          <div className="flex justify-center mb-16">
            <Button 
              variant="gradient" 
              size="lg"
              onClick={handleStartCreating}
              className="text-lg px-8 py-4 h-auto"
            >
              + Start Creating Free
            </Button>
          </div>

          {/* Preview mockup */}
          <div className="relative max-w-4xl mx-auto">
            <div className="bg-card border border-border/50 rounded-lg shadow-card overflow-hidden backdrop-blur-sm">
              <div className="flex items-center gap-2 px-4 py-3 bg-muted/50 border-b border-border/50">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
              </div>
              <div className="bg-gradient-card p-8 md:p-16 text-center">
                <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
                  Welcome to the Future
                </h2>
                <p className="text-muted-foreground text-lg">
                  Experience innovation like never before
                </p>
              </div>
            </div>

            {/* Floating elements */}
            <div className="absolute -top-4 -left-4 w-8 h-8 bg-primary/20 rounded-full blur-sm"></div>
            <div className="absolute -bottom-6 -right-6 w-12 h-12 bg-primary-glow/20 rounded-full blur-md"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
