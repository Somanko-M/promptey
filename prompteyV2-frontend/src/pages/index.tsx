import Header from "../components/Header";
import Hero from "../components/Hero";
import FooterSimple from "../components/FooterSimple";

const faqs = [
  {
    question: "What is an AI website builder and how does it work?",
    answer:
      "An AI website builder uses machine learning to generate a fully structured website from your prompt, layout preferences, and content. It designs pages, suggests images, and creates SEO-optimized copy—all without coding required.",
  },
  {
    question: "Can I customize the design created by the AI?",
    answer:
      "Yes! After the AI generates your site, you can tweak layouts, colors, fonts, and replace images or text using a visual editor—no code needed. You retain full design control.",
  },
  {
    question: "Is coding knowledge required to use an AI website builder?",
    answer:
      "Not at all. These tools are built for non-technical users—no coding or technical skills are necessary. Simply provide your business type and preferences, and the AI handles the rest.",
  },
  {
    question: "Does an AI website builder include SEO features?",
    answer:
      "Absolutely—most AI builders auto-generate sitemaps, meta tags, responsive layouts, and even keyword suggestions to improve search engine ranking by default.",
  },
  {
    question: "Can I integrate ecommerce or forms with AI-built sites?",
    answer:
      "Yes, many AI website builders allow you to add ecommerce capabilities, contact forms, booking systems, and chatbots with simple integrations—no technical setup needed.",
  },
];

const Index = () => (
  <div className="min-h-screen bg-background flex flex-col">
    <Header />
    <Hero />

    {/* 🧠 SEO-Friendly FAQ Section */}
    <section aria-labelledby="faq-heading" className="py-16 bg-background">
  <div className="container mx-auto px-6">
    <h2 id="faq-heading" className="text-3xl font-bold text-center mb-10 text-foreground">
      Frequently Asked Questions about Our AI Website Builder
    </h2>
    <dl className="space-y-6 max-w-4xl mx-auto">
      {faqs.map((faq, idx) => (
        <div
          key={idx}
          className="bg-card border border-border rounded-xl p-6 shadow-sm transition duration-200"
        >
          <dt className="font-semibold text-lg text-foreground">{faq.question}</dt>
          <dd className="mt-2 text-muted-foreground leading-relaxed">{faq.answer}</dd>
        </div>
      ))}
    </dl>
  </div>
</section>


    <FooterSimple />
  </div>
);

export default Index;
