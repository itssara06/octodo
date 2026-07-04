import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Plus, 
  Search, 
  LayoutGrid, 
  List, 
  KanbanSquare,
  Globe,
  GitBranch,
  PenTool
} from 'lucide-react';
import Link from 'next/link';

export default function Projects() {
  const projects = [
    {
      id: 'cosmo',
      name: 'Cosmo',
      status: 'Active',
      description: 'A personal finance tracker and portfolio manager.',
      tags: ['Next.js', 'Finance', 'Dashboard'],
      updatedAt: '2 days ago'
    },
    {
      id: 'travel-india',
      name: 'Travel India',
      status: 'Planning',
      description: 'Itinerary planner and booking aggregator for domestic travel.',
      tags: ['Travel', 'React Native'],
      updatedAt: '4 days ago'
    },
    {
      id: 'portfolio',
      name: 'Portfolio',
      status: 'Completed',
      description: 'Personal portfolio website showcasing design and dev work.',
      tags: ['Design', 'Three.js'],
      updatedAt: '1 week ago'
    }
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground mt-2">Manage and track your active and past projects.</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Project
        </Button>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 max-w-sm relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search projects..." className="pl-9" />
        </div>
        <div className="flex items-center gap-2 bg-muted p-1 rounded-lg">
          <Button variant="ghost" size="icon" className="h-8 w-8 bg-background shadow-sm">
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
            <List className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
            <KanbanSquare className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <Link key={project.id} href={`/projects/${project.id}`}>
            <Card className="h-full hover:border-primary/50 transition-colors group cursor-pointer">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-xl font-bold text-primary">
                    {project.name[0]}
                  </div>
                  <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-primary/10 text-primary">
                    {project.status}
                  </span>
                </div>
                <CardTitle className="mt-4">{project.name}</CardTitle>
                <CardDescription className="line-clamp-2 mt-1">{project.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-6">
                  {project.tags.map(tag => (
                    <span key={tag} className="text-xs font-medium bg-muted px-2 py-1 rounded-md text-muted-foreground">
                      {tag}
                    </span>
                  ))}
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Globe className="h-4 w-4 hover:text-foreground transition-colors" />
                    <GitBranch className="h-4 w-4 hover:text-foreground transition-colors" />
                    <PenTool className="h-4 w-4 hover:text-foreground transition-colors" />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Updated {project.updatedAt}
                  </span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
