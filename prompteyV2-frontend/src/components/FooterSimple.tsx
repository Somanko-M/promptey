import { Link } from "react-router-dom";
import { Github, Linkedin, X } from "lucide-react";

const FooterSimple = () => {
  return (
    <footer className="bg-card border-t border-border/50 mt-auto">
      <div className="container mx-auto px-6 py-12">
        {/* Brand Section */}
        <div className="text-center max-w-2xl mx-auto">
          <Link to="/" className="flex items-center gap-2 justify-center mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
              <span className="text-white font-bold text-lg">P</span>
            </div>
            <span className="text-xl font-bold text-foreground">PromptEy</span>
          </Link>
          <p className="text-muted-foreground text-sm leading-relaxed mb-6">
            Create stunning websites with AI-powered technology. Transform your ideas into beautiful, responsive websites using simple text prompts.
          </p>
          
          {/* Social Links */}
          <div className="flex gap-6 justify-center mb-8">
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors" aria-label="X (Twitter)">
              <X size={20} />
            </a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors" aria-label="LinkedIn">
              <Linkedin size={20} />
            </a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors" aria-label="GitHub">
              <Github size={20} />
            </a>
          </div>

          {/* Copyright */}
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} PromptEy. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default FooterSimple;