/**
 * Login Page
 * 
 * The login page for Mint AI. Users can sign in with their email and password.
 */

import { LoginForm } from "@/components/auth/LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const params = await searchParams;
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
            Mint AI
          </h1>
          <p className="text-muted-foreground mt-2">
            Generate UI fast with AI
          </p>
        </div>
        
        <LoginForm redirectTo={params.redirect || "/"} />
        
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            By signing in, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
