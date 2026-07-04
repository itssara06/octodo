import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  ArrowLeft,
  Globe,
  GitBranch,
  PenTool,
  FileText,
  StickyNote,
  Image as ImageIcon,
  Clock,
  Calendar
} from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default async function ProjectDetail({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const { id } = resolvedParams;

  // Mock project data
  const project = {
    id: 'cosmo',
    name: 'Cosmo',
    status: 'Active',
    description: 'A personal finance tracker and portfolio manager. Features include connecting to bank APIs, tracking crypto assets, and forecasting net worth.',
    tags: ['Next.js', 'Finance', 'Dashboard', 'Tailwind', 'PostgreSQL'],
    links: {
      production: 'https://cosmo.finance',
      github: 'https://github.com/username/cosmo',
      figma: 'https://figma.com/file/...',
    },
    dates: {
      created: 'Jan 15, 2025',
      updated: '2 days ago'
    }
  };

  if (id !== project.id) {
    // For demo purposes, we just fallback or show 404
    // notFound();
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <Link href="/projects" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Projects
      </Link>

      <div className="flex flex-col md:flex-row md:items-start gap-8">
        <div className="flex-1 space-y-6">
          <div className="flex items-start gap-6">
            <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-4xl font-bold text-primary shrink-0">
              {project.name[0]}
            </div>
            <div className="space-y-2 pt-2">
              <div className="flex items-center gap-3">
                <h1 className="text-4xl font-bold tracking-tight">{project.name}</h1>
                <span className="text-xs font-medium px-3 py-1 rounded-full bg-primary/10 text-primary">
                  {project.status}
                </span>
              </div>
              <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
                {project.description}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {project.tags.map(tag => (
              <span key={tag} className="text-sm font-medium bg-muted px-3 py-1.5 rounded-md text-muted-foreground">
                {tag}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t">
            <a href={project.links.production} target="_blank" rel="noopener noreferrer" className={cn(buttonVariants({ variant: "outline" }), "w-full justify-start gap-2")}>
              <Globe className="h-4 w-4 text-muted-foreground" />
              Live Website
            </a>
            <a href={project.links.github} target="_blank" rel="noopener noreferrer" className={cn(buttonVariants({ variant: "outline" }), "w-full justify-start gap-2")}>
              <GitBranch className="h-4 w-4 text-muted-foreground" />
              Repository
            </a>
            <a href={project.links.figma} target="_blank" rel="noopener noreferrer" className={cn(buttonVariants({ variant: "outline" }), "w-full justify-start gap-2")}>
              <PenTool className="h-4 w-4 text-muted-foreground" />
              Figma Design
            </a>
          </div>
        </div>

        <div className="w-full md:w-80 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Resources</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 group cursor-pointer">
                <div className="h-10 w-10 rounded bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <FileText className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-sm font-medium group-hover:text-primary transition-colors">PRD Document</p>
                  <p className="text-xs text-muted-foreground">PDF • 2.4 MB</p>
                </div>
              </div>
              <div className="flex items-center gap-3 group cursor-pointer">
                <div className="h-10 w-10 rounded bg-amber-500/10 flex items-center justify-center shrink-0">
                  <StickyNote className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-sm font-medium group-hover:text-primary transition-colors">Meeting Notes</p>
                  <p className="text-xs text-muted-foreground">Note • Updated yesterday</p>
                </div>
              </div>
              <div className="flex items-center gap-3 group cursor-pointer">
                <div className="h-10 w-10 rounded bg-blue-500/10 flex items-center justify-center shrink-0">
                  <ImageIcon className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm font-medium group-hover:text-primary transition-colors">Brand Assets</p>
                  <p className="text-xs text-muted-foreground">ZIP • 14.2 MB</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center text-muted-foreground">
                  <Calendar className="mr-2 h-4 w-4" />
                  Created
                </span>
                <span className="font-medium">{project.dates.created}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center text-muted-foreground">
                  <Clock className="mr-2 h-4 w-4" />
                  Last Updated
                </span>
                <span className="font-medium">{project.dates.updated}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
