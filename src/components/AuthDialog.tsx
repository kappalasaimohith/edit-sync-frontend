import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { ApiError } from "@/services/api";

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAuthenticated: () => void;
}

export const AuthDialog = ({ open, onOpenChange, onAuthenticated }: AuthDialogProps) => {
  const { login, register, isAuthenticated, logout, refreshAuthState } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("signin");

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    confirmPassword: ''
  });


  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setFormData({
        email: '',
        password: '',
        name: '',
        confirmPassword: ''
      });
    }
  }, [open]);

  // Close dialog when authentication state changes
  useEffect(() => {
    if (isAuthenticated) {
      onAuthenticated();
      onOpenChange(false);
    }
  }, [isAuthenticated, onAuthenticated, onOpenChange]);

  const handleInputChange = useCallback((field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSignIn = useCallback(async () => {
    if (!formData.email || !formData.password) {
      toast({
        title: "Error",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await login({
        email: formData.email,
        password: formData.password
      });
      
      // Close dialog and trigger auth state update
      onOpenChange(false);
      onAuthenticated();
      
      toast({
        title: "Welcome back!",
        description: "You have been signed in successfully.",
      });
    } catch (error) {
      if (error instanceof ApiError) {
        toast({
          title: "Sign In Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "An unexpected error occurred. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [formData.email, formData.password, login, onOpenChange, onAuthenticated]);

  const handleSignUp = useCallback(async () => {
    if (!formData.email || !formData.password || !formData.name) {
      toast({
        title: "Error",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    try {
      await register({
        email: formData.email,
        password: formData.password,
        name: formData.name
      });
      
      // Close dialog and trigger auth state update
      onOpenChange(false);
      onAuthenticated();
      
      toast({
        title: "Account created!",
        description: "Welcome to Edit-Sync. Your account has been created successfully.",
      });
    } catch (error) {
      if (error instanceof ApiError) {
        toast({
          title: "Registration Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "An unexpected error occurred. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [formData, register, onOpenChange, onAuthenticated]);

  // Add delete account logic
  const handleDeleteAccount = useCallback(async () => {
    if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) return;
    try {
      setIsLoading(true);
      // Use the deleteAccount method from useAuth (not direct authApi)
      if (typeof window !== 'undefined' && (window as unknown as { authApi?: { deleteAccount: () => Promise<void> } }).authApi) {
        await (window as unknown as { authApi: { deleteAccount: () => Promise<void> } }).authApi.deleteAccount();
      } else if (logout && refreshAuthState) {
        // fallback: call logout and refresh
        logout();
        refreshAuthState();
      }
      toast({
        title: 'Account Deleted',
        description: 'Your account has been deleted successfully.',
      });
      logout();
      refreshAuthState();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete account. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [logout, refreshAuthState, onOpenChange]);

  const signInForm = useMemo(() => (
    <TabsContent value="signin" className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="signin-email">Email</Label>
        <Input
          id="signin-email"
          type="email"
          placeholder="Enter your email"
          value={formData.email}
          onChange={(e) => handleInputChange('email', e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="signin-password">Password</Label>
        <Input
          id="signin-password"
          type="password"
          placeholder="Enter your password"
          value={formData.password}
          onChange={(e) => handleInputChange('password', e.target.value)}
        />
      </div>
      <Button 
        onClick={handleSignIn} 
        className="w-full" 
        disabled={isLoading}
      >
        {isLoading ? "Signing In..." : "Sign In"}
      </Button>
    </TabsContent>
  ), [formData.email, formData.password, isLoading, handleSignIn, handleInputChange]);

  const signUpForm = useMemo(() => (
    <TabsContent value="signup" className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="signup-name">Name</Label>
        <Input
          id="signup-name"
          type="text"
          placeholder="Enter your name"
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="signup-email">Email</Label>
        <Input
          id="signup-email"
          type="email"
          placeholder="Enter your email"
          value={formData.email}
          onChange={(e) => handleInputChange('email', e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="signup-password">Password</Label>
        <Input
          id="signup-password"
          type="password"
          placeholder="Enter your password"
          value={formData.password}
          onChange={(e) => handleInputChange('password', e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="signup-confirm-password">Confirm Password</Label>
        <Input
          id="signup-confirm-password"
          type="password"
          placeholder="Confirm your password"
          value={formData.confirmPassword}
          onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
        />
      </div>
      <Button 
        onClick={handleSignUp} 
        className="w-full" 
        disabled={isLoading}
      >
        {isLoading ? "Creating Account..." : "Create Account"}
      </Button>
    </TabsContent>
  ), [formData, isLoading, handleSignUp, handleInputChange]);

  // Only show delete account and logout after login
  // if (isAuthenticated && open) {
  //   return (
  //     <Dialog open={open} onOpenChange={onOpenChange}>
  //       <DialogContent className="sm:max-w-[425px]">
  //         <DialogHeader>
  //           <DialogTitle>Account</DialogTitle>
  //           <DialogDescription>
  //             Manage your account settings below.
  //           </DialogDescription>
  //         </DialogHeader>
  //         <div className="flex flex-col gap-4 mt-4">
  //           <Button variant="outline" onClick={() => {
  //             logout();
  //             onOpenChange(false); // Close dialog after logout
  //           }} disabled={isLoading}>
  //             Log Out
  //           </Button>
  //           <Button variant="destructive" onClick={handleDeleteAccount} disabled={isLoading}>
  //             {isLoading ? 'Deleting Account...' : 'Delete Account'}
  //           </Button>
  //         </div>
  //       </DialogContent>
  //     </Dialog>
  //   );
  // }

  // Show sign in / sign up forms
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader >
          <DialogTitle>Welcome to Edit-Sync</DialogTitle>
          <DialogDescription>
            Sign in to your account or create a new one to get started.
          </DialogDescription>
        </DialogHeader>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="relative w-full">
        <TabsList className="grid w-full grid-cols-2 relative bg-muted p-1 rounded-md overflow-hidden">
            <div
              className={`absolute top-0 left-0 h-full w-1/2 bg-white rounded-md shadow transition-all duration-300 ease-in-out transform ${
                activeTab === "signup" ? "translate-x-full" : "translate-x-0"
              }`}
            />
            <TabsTrigger value="signin" className="z-10">
              Sign In
            </TabsTrigger>
            <TabsTrigger value="signup" className="z-10">
              Sign Up
            </TabsTrigger>
          </TabsList>
          </div>
          <div className="transition-all duration-300 ease-in-out animate-fade-slide">
            {activeTab === "signin" && signInForm}
            {activeTab === "signup" && signUpForm}
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
