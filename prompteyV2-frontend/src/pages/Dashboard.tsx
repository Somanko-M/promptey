import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import Header from "../components/Header";
import FooterSimple from "../components/FooterSimple";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { db } from "@/firebase";
import { useNavigate } from "react-router-dom";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  getDoc,
} from "firebase/firestore";
import TitleEditModal from "@/components/TitleEditModal";
import { deleteDoc } from "firebase/firestore";
import { toast } from "sonner";



type Project = {
  id: string;
  title: string;
  pages?: {
    home?: {
      html: string;
      css: string;
      js: string;
    };
  };
  created_at: any;
  updated_at: any;
};


const Dashboard = () => {
  const { firebaseUser, userData, login } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);

  const [editOpen, setEditOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  useEffect(() => {
    if (!firebaseUser) return;

    const fetchData = async () => {
      try {
        // 🔒 Safely fetch only the current user’s data
        const userRef = doc(db, "users", firebaseUser.uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          console.error("❌ User document not found");
          return;
        }

        const projSnap = await getDocs(collection(db, "users", firebaseUser.uid, "projects"));
        const allProjects = projSnap.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Project, "id">),
        }));

        setProjects(allProjects);
      } catch (error) {
        console.error("❌ Failed to fetch user projects:", error);
      }
    };

    fetchData();
  }, [firebaseUser]);

  const handleCreateProject = async () => {
    if (!firebaseUser || !userData) return;

    const max = userData.plan === "premium" ? 10 : 5;
    if (projects.length >= max) {
      alert("You've reached your project limit.");
      return;
    }

    const docRef = await addDoc(collection(db, "users", firebaseUser.uid, "projects"), {
      title: "Untitled Project",
      html: "",
      css: "",
      js: "",
      created_at: new Date(),
      updated_at: new Date(),
    });

    setProjects((prev) => [
      ...prev,
      {
        id: docRef.id,
        title: "Untitled Project",
        html: "",
        css: "",
        js: "",
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  };

  const handleEditTitle = (project: Project) => {
    setSelectedProject(project);
    setEditOpen(true);
  };

  const handleTitleSave = async (newTitle: string) => {
    if (!selectedProject || !firebaseUser) return;

    const updated = { ...selectedProject, title: newTitle };
    await updateDoc(doc(db, "users", firebaseUser.uid, "projects", selectedProject.id), {
      title: newTitle,
      updated_at: new Date(),
    });

    setProjects((prev) =>
      prev.map((p) => (p.id === selectedProject.id ? updated : p))
    );

    setEditOpen(false);
    setSelectedProject(null);
  };

  const handlePreview = (project: Project) => {
    const html = project.pages?.home?.html || "";
const css = project.pages?.home?.css || "";
const js = project.pages?.home?.js || "";

    const win = window.open();
    if (!win) return;
    win.document.write(`
      <html><head><style>${css}</style></head>
      <body>${html}<script>${js}</script></body></html>
    `);
    win.document.close();
  };

  const handleDownload = async (project: Project) => {
  if (!firebaseUser || !userData) return;

  const plan = userData.plan;
  const downloadUsed = userData.downloadUsed || 0;
  const planExpiry = userData.planExpiry?.toDate?.();

  // ⛔ Restrict free users
  if (plan === "free") {
    alert("🚫 Downloads are only available in paid plans.");
    navigate("/pricing");
    return;
  }

  // ⛔ Restrict Download & Extra users if already used
  if ((plan === "download" || plan === "extra") && downloadUsed >= 1) {
    alert("⚠️ You’ve already used your download.");
    return;
  }

  // ⛔ For extra plan, allow only on the same day of payment
  if (plan === "extra" && planExpiry) {
    const today = new Date().toDateString();
    const expiryDateStr = planExpiry.toDateString();
    if (today !== expiryDateStr) {
      alert("⚠️ Your download access has expired.");
      return;
    }
  }

  // ✅ Fetch correct HTML, CSS, JS from project.pages.home
  const page = project.pages?.home;
  if (!page?.html || !page?.css || !page?.js) {
    alert("⚠️ This project doesn't have valid HTML/CSS/JS to download.");
    return;
  }

  // ✅ Build and trigger file download
  const blob = new Blob(
    [
      `<html><head><style>${page.css}</style></head><body>${page.html}<script>${page.js}</script></body></html>`,
    ],
    { type: "text/html" }
  );

  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${project.title || "project"}.html`;
  a.click();

  // ✅ Increment download count for non-premium plans
  if (plan !== "premium") {
    await updateDoc(doc(db, "users", firebaseUser.uid), {
      downloadUsed: downloadUsed + 1,
    });
  }
};
const handleDeleteProject = async (projectId: string) => {
  if (!firebaseUser) return;

  const confirmed = window.confirm("Are you sure you want to delete this project?");
  if (!confirmed) return;

  try {
    // 🧹 Delete from Firestore
    await deleteDoc(doc(db, "users", firebaseUser.uid, "projects", projectId));

    // 🧼 Remove from UI
    setProjects((prev) => prev.filter((p) => p.id !== projectId));

    // ✅ Show toast
    toast.success("Project deleted successfully");
  } catch (err) {
    console.error("❌ Failed to delete project:", err);
    toast.error("Failed to delete project. Please try again.");
  }
};





  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="container mx-auto px-6 py-8 flex-1">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">My Projects</h1>
            <p className="text-muted-foreground mt-1">
              Create and manage your AI-generated websites
            </p>
          </div>
          {firebaseUser && (
            <Button variant="gradient" onClick={handleCreateProject}>
              + Create Project
            </Button>
          )}
        </div>

        {!firebaseUser && (
          <div className="text-center py-20">
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-card flex items-center justify-center">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M14 2H6C5.47 2 4.96 2.21 4.59 2.59C4.21 2.96 4 3.47 4 4V20C4 20.53 4.21 21.04 4.59 21.41C4.96 21.79 5.47 22 6 22H18C18.53 22 19.04 21.79 19.41 21.41C19.79 21.04 20 20.53 20 20V8L14 2Z"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <path
                    d="M14 2V8H20M12 11V17M9 14H15"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">No projects yet</h3>
              <p className="text-muted-foreground mb-6">
                Sign in to start building AI websites
              </p>
              <Button variant="gradient" onClick={login}>
                Sign in with Google
              </Button>
            </div>
          </div>
        )}

        {firebaseUser && projects.length === 0 && (
          <div className="text-center py-20">
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-card flex items-center justify-center">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M14 2H6C5.47 2 4.96 2.21 4.59 2.59C4.21 2.96 4 3.47 4 4V20C4 20.53 4.21 21.04 4.59 21.41C4.96 21.79 5.47 22 6 22H18C18.53 22 19.04 21.79 19.41 21.41C19.79 21.04 20 20.53 20 20V8L14 2Z"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <path
                    d="M14 2V8H20M12 11V17M9 14H15"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">No projects yet</h3>
              <p className="text-muted-foreground mb-6">
                Start by creating your first AI-powered website
              </p>
              <Button variant="gradient" onClick={handleCreateProject}>
                + Create Project
              </Button>
            </div>
          </div>
        )}

        {firebaseUser && projects.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((proj) => (
              <Card key={proj.id} className="bg-card border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold truncate">{proj.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Last updated:{" "}
                    {proj.updated_at?.seconds
                      ? new Date(proj.updated_at.seconds * 1000).toLocaleString()
                      : "N/A"}
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    <Button size="sm" onClick={() => handleEditTitle(proj)}>Edit Title</Button>
                    <Button size="sm" variant="secondary" onClick={() => handlePreview(proj)}>Preview</Button>
                    <Button size="sm" variant="outline" onClick={() => handleDownload(proj)}>Download</Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDeleteProject(proj.id)}>Delete</Button>
                    <Button size="sm" variant="default" onClick={() => navigate(`/prompt-builder?id=${proj.id}`)}>Continue</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <TitleEditModal
          open={editOpen}
          defaultValue={selectedProject?.title || ""}
          onCancel={() => setEditOpen(false)}
          onSave={handleTitleSave}
        />
      </main>

      <FooterSimple />
    </div>
  );
};

export default Dashboard;
