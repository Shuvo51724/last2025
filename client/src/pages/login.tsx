import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useCustomization } from "@/contexts/CustomizationContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function Login() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { customization } = useCustomization();
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const result = await login(userId, password);
    if (result.success) {
      setLocation("/");
    } else {
      setError(result.message || "Invalid User ID or Password");
    }
  };

  const logoUrl = customization.loginPage.logoUrl || customization.logoUrl || "/logo.png";

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        backgroundImage: customization.loginPage.backgroundImageUrl 
          ? `url(${customization.loginPage.backgroundImageUrl})` 
          : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundColor: customization.loginPage.backgroundImageUrl ? undefined : customization.theme.background,
      }}
    >
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-4 text-center pb-8">
          <div className="mx-auto w-24 h-24 flex items-center justify-center">
            <img src={logoUrl} alt={`${customization.appName} Logo`} className="w-full h-full object-contain" />
          </div>
          <div>
            <CardTitle className="text-3xl font-bold">{customization.appName}</CardTitle>
            <CardDescription className="text-sm mt-2">
              {customization.loginPage.welcomeText}
            </CardDescription>
            {customization.loginPage.showDeveloperCredit && (
              <p className="text-xs mt-2 text-muted-foreground font-normal">
                Developed by MOHAMMAD SAIFUDDIN
              </p>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="userId" className="text-sm font-medium">
                User ID
              </Label>
              <Input
                id="userId"
                data-testid="input-userId"
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="Enter your user ID"
                className="h-12"
                autoComplete="username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <Input
                id="password"
                data-testid="input-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="h-12"
                autoComplete="current-password"
              />
            </div>
            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md" data-testid="text-error">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}
            <Button type="submit" className="w-full h-12 font-medium" data-testid="button-login">
              Sign In
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
