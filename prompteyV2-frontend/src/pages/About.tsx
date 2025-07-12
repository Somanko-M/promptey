import { Card, CardContent } from "@/components/ui/card";
import Header from "@/components/Header";

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground via-primary to-primary-glow bg-clip-text text-transparent">
            About PromptEy
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            We're on a mission to democratize web development through AI-powered tools.
          </p>
        </div>

        {/* Story Section */}
        <div className="max-w-4xl mx-auto mb-16">
          <Card className="bg-gradient-card border-border/50">
            <CardContent className="p-8 md:p-12">
              <h2 className="text-3xl font-bold text-foreground mb-6">Our Story</h2>
              <div className="prose prose-lg max-w-none text-muted-foreground space-y-4">
                <p>
                  PromptEy V2 was born out of frustration — and vision.
While building websites for clients, we realized how time-consuming and repetitive it was to translate someone’s vague idea into a polished digital product. That's when the idea struck:
What if anyone could build a website by simply describing what they wanted?


                </p>
                <p>
                  From our dorm rooms and late-night brainstorming sessions, we started experimenting with AI tools and automation. Our first prototype was rough — but it proved the point. People could describe their idea, and within seconds, get a functional, customizable website.

PromptEy V2 is the refined version of that dream — powered by advanced AI models, modern UI design, and feedback from hundreds of early users.


                </p>
                <p>
                  Today, we serve a growing community of freelancers, creators, and hustlers who don’t want to code — they want results. Whether you're launching a portfolio, a product, or an entire business, PromptEy helps you go from idea → website instantly.

We're just getting started.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Values */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {[
            {
              title: "Innovation",
              description: "We push the boundaries of what's possible with AI and web technology.",
              icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2"/>
                </svg>
              )
            },
            {
              title: "Accessibility",
              description: "We make powerful web development tools accessible to everyone.",
              icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 21V19C16 17.9391 15.5786 16.9217 14.8284 16.1716C14.0783 15.4214 13.0609 15 12 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="2"/>
                  <circle cx="8.5" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                  <path d="M20 8V14M23 11H17" stroke="currentColor" strokeWidth="2"/>
                </svg>
              )
            },
            {
              title: "Quality",
              description: "Every website generated meets the highest standards of design and performance.",
              icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" stroke="currentColor" strokeWidth="2"/>
                </svg>
              )
            }
          ].map((value, index) => (
            <Card key={index} className="bg-gradient-card border-border/50 hover:shadow-card transition-all duration-300 text-center">
              <CardContent className="p-8">
                <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  {value.icon}
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-4">{value.title}</h3>
                <p className="text-muted-foreground">{value.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Contact */}
        <div className="text-center">
          <Card className="bg-gradient-card border-border/50 max-w-2xl mx-auto">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-foreground mb-4">Get in Touch</h2>
              <p className="text-muted-foreground mb-6">
                Have questions or want to learn more about PromptEy? We'd love to hear from you.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a 
                  href="mailto:somankomulherjee21@gmail.com" 
                  className="text-primary hover:text-primary-glow transition-colors"
                >
                  somankomulherjee21@gmail.com
                </a>
                <span className="hidden sm:inline text-muted-foreground">|</span>
                <a 
                  href="tel:+91 9073242232" 
                  className="text-primary hover:text-primary-glow transition-colors"
                >
                  +91 9073242232
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default About;