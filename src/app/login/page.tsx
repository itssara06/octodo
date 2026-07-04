"use client";

import { useActionState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { loginAction } from '@/app/actions/auth';
import { AlertCircle } from 'lucide-react';

const initialState = {
  error: null as string | null
};

export default function Login() {
  const [state, action, isPending] = useActionState(loginAction as any, initialState);

  return (
    <div className="min-h-screen w-full flex-1 flex items-center justify-center relative overflow-hidden bg-background">
      {/* Dynamic Background Elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl mix-blend-multiply opacity-70 animate-blob" />
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl mix-blend-multiply opacity-70 animate-blob animation-delay-2000" />
      <div className="absolute -bottom-32 left-1/2 w-96 h-96 bg-rose-500/20 rounded-full blur-3xl mix-blend-multiply opacity-70 animate-blob animation-delay-4000" />

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md px-4">
        <Card className="backdrop-blur-xl bg-background/60 border-white/20 shadow-2xl">
          <form action={action}>
            <CardHeader className="space-y-1 pb-8">
              <div className="flex justify-center mb-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-indigo-600 text-primary-foreground font-bold text-xl shadow-lg ring-1 ring-white/20">
                  OS
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-center tracking-tight">Welcome back</CardTitle>
              <CardDescription className="text-center text-muted-foreground">
                Sign in to your Personal OS
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {state?.error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md flex items-center gap-2 text-destructive text-sm font-medium">
                  <AlertCircle className="h-4 w-4" />
                  {state.error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input name="email" id="email" type="email" placeholder="you@example.com" className="bg-background/50 backdrop-blur-sm" required />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <a href="#" className="text-sm font-medium text-primary hover:underline">
                    Forgot password?
                  </a>
                </div>
                <Input name="password" id="password" type="password" className="bg-background/50 backdrop-blur-sm" required />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4 pt-4">
              <Button type="submit" disabled={isPending} className="w-full bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-600/90 shadow-lg transition-all" size="lg">
                {isPending ? "Signing in..." : "Sign In"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
