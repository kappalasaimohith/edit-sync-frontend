import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Copy, Link, User, Loader2, Mail } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { shareApi, ShareSettings, SharedUser } from "@/services/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { documentApi } from "@/services/api";

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: {
    id?: string;
    _id?: string;
    title: string;
    content: string;
    fileType?: string; 
  };
}

export const ShareDialog = ({ open, onOpenChange, document }: ShareDialogProps) => {
  const [shareSettings, setShareSettings] = useState<ShareSettings>({
    isPublic: false,
    permission: 'view',
    allowComments: true,
    expiresIn: 'never'
  });
  
  const [sharedUsers, setSharedUsers] = useState<SharedUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePermission, setInvitePermission] = useState<'view' | 'edit' | 'comment'>('view');
  const [shareMessage, setShareMessage] = useState('');
  const [activeTab, setActiveTab] = useState('invite');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [documentOwnerId, setDocumentOwnerId] = useState<string | null>(null);

  const loadSharedUsers = useCallback(async (documentId: string) => {
    if (!documentId) {
      console.error('[ShareDialog] loadSharedUsers called without documentId');
      return;
    }
    
    console.log('[ShareDialog] Loading shared users for document:', documentId);
    setIsLoading(true);
    try {
      const users = await shareApi.getSharedUsers(documentId);
      console.log('[ShareDialog] Loaded shared users:', users);
      setSharedUsers(users);
    } catch (error: unknown) {
      const err = error as { message?: string; status?: number; data?: unknown };
      console.error('[ShareDialog] Error loading shared users:', {
        error,
        message: err.message,
        status: err.status,
        data: err.data
      });
      toast({
        title: "Error",
        description: err.message || "Failed to load shared users",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open && document) {
      const documentId = document._id || document.id;
      console.log('[ShareDialog] Document opened:', {
        documentId,
        document,
        open
      });
      if (documentId) {
        loadSharedUsers(documentId);
        // Get current user ID from JWT
        const token = localStorage.getItem('token');
        let userId = null;
        if (token) {
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            userId = (payload.userId || payload.id || payload._id || '').toString();
          } catch {/* ignore JWT parse error */}
        }
        setCurrentUserId(userId);
        // Get document owner ID
        documentApi.getById(documentId).then(doc => {
          setDocumentOwnerId((doc.owner || doc._id || '').toString());
        }).catch(() => setDocumentOwnerId(null));
      } else {
        console.error('[ShareDialog] No document ID available:', document);
        toast({
          title: "Error",
          description: "Invalid document ID",
          variant: "destructive",
        });
      }
    }
  }, [open, document, loadSharedUsers]);

  const shareUrl = useMemo(() => {
    const documentId = document._id || document.id;
    return `https://editsync.app/share/${documentId}`;
  }, [document._id, document.id]);

  const handleCopyLink = useCallback(() => {
    navigator.clipboard.writeText(shareUrl);
    toast({
      title: "Link copied!",
      description: "Share link has been copied to your clipboard.",
    });
  }, [shareUrl]);

  const handleInviteByEmail = useCallback(async () => {
    if (!inviteEmail) {
      console.log('[ShareDialog] Invite email missing');
      toast({
        title: "Error",
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }

    const documentId = document._id || document.id;
    console.log('[ShareDialog] Inviting user:', {
      documentId,
      email: inviteEmail,
      permission: invitePermission
    });

    if (!documentId) {
      console.error('[ShareDialog] Invalid document ID for invite');
      toast({
        title: "Error",
        description: "Invalid document ID",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const newUser = await shareApi.inviteUser(documentId, inviteEmail, invitePermission);
      console.log('[ShareDialog] User invited successfully:', newUser);
      setSharedUsers(prev => [...prev, newUser]);
      setInviteEmail('');
      toast({
        title: "Invitation sent!",
        description: "The user will receive an email invitation to collaborate.",
      });
    } catch (error: unknown) {
      const err = error as { message?: string; status?: number; data?: unknown };
      console.error('[ShareDialog] Error inviting user:', {
        error,
        message: err.message,
        status: err.status,
        data: err.data
      });
      toast({
        title: "Error",
        description: err.message || "Failed to invite user",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [document._id, document.id, inviteEmail, invitePermission]);

  const handleRemoveUser = useCallback(async (userId: string) => {
    const documentId = document._id || document.id;
    if (!documentId) {
      toast({
        title: "Error",
        description: "Invalid document ID",
        variant: "destructive",
      });
      return;
    }

    try {
      // Get user ID from JWT token
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Not authenticated');
      }
      const payload = JSON.parse(atob(token.split('.')[1]));
      // Try all possible userId keys and fallback to string
      const currentUserId = (payload.userId || payload.id || payload._id || '').toString();

      // Fetch document to get owner
      const doc = await documentApi.getById(documentId);
      // Use owner key and fallback to string
      const documentOwnerId = (doc.owner || doc._id || '').toString();

      // Debug log
      console.log('[ShareDialog] Remove user check', { currentUserId, documentOwnerId, userId });

      // Allow owner to remove anyone, allow collaborators to remove themselves
      // Fix: Only block if neither owner nor self
      if (documentOwnerId !== currentUserId && userId !== currentUserId) {
        throw new Error('Only the document owner can remove other collaborators');
      }
      // Fix: Allow owner to remove themselves (if needed)
      // If owner is removing themselves, block and show error
      if (documentOwnerId === userId && documentOwnerId === currentUserId) {
        throw new Error('The document owner cannot remove themselves');
      }

      // Remove the _id: prefix if present
      const cleanUserId = userId.startsWith('_id:') ? userId.substring(4) : userId;
      const cleanDocId = documentId.startsWith('_id:') ? documentId.substring(4) : documentId;

      await shareApi.removeUser(cleanDocId, cleanUserId);
      setSharedUsers(prev => prev.filter(user => user.id !== userId));
      toast({
        title: "User removed",
        description: "The user has been removed from the document.",
      });
    } catch (error: unknown) {
      console.error('[ShareDialog] Error removing user:', error);
      toast({
        title: "Error",
        description: (error as Error).message || "Failed to remove user",
        variant: "destructive",
      });
    }
  }, [document._id, document.id]);

  const handleShareSettingsChange = useCallback(async (key: string, value: unknown) => {
    const documentId = document._id || document.id;
    if (!documentId) {
      toast({
        title: "Error",
        description: "Invalid document ID",
        variant: "destructive",
      });
      return;
    }

    const newSettings = { ...shareSettings, [key]: value };
    setShareSettings(newSettings);
    
    try {
      await shareApi.shareDocument(documentId, newSettings);
      toast({
        title: "Settings updated",
        description: "Document sharing settings have been updated.",
      });
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: (error as Error).message || "Failed to update sharing settings",
        variant: "destructive",
      });
      // Revert the change if it failed
      setShareSettings(shareSettings);
    }
  }, [document._id, document.id, shareSettings]);

  const handleShareByEmail = useCallback(async () => {
    if (!inviteEmail) {
      toast({
        title: "Error",
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }

    const documentId = document._id || document.id;
    if (!documentId) {
      toast({
        title: "Error",
        description: "Invalid document ID",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // First invite the user to get their ID
      const newUser = await shareApi.inviteUser(documentId, inviteEmail, invitePermission);
      
      // Then send the share email
      await shareApi.sendShareEmail(documentId, inviteEmail, invitePermission, shareMessage);
      
      // Update the shared users list
      setSharedUsers(prev => [...prev, newUser]);
      setInviteEmail('');
      setShareMessage('');
      
      toast({
        title: "Success!",  
        description: "The document has been shared and an email has been sent.",
      });
    } catch (error: unknown) {
      console.error('Share error:', error);
      toast({
        title: "Error",
        description: (error as Error).message || "Failed to share document",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [document._id, document.id, inviteEmail, invitePermission, shareMessage]);

  const publicSharingSection = useMemo(() => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Label className="text-base font-medium">Public access</Label>
          <p className="text-sm text-slate-600">
            Allow anyone with the link to access this document
          </p>
        </div>
        <Switch
          checked={shareSettings.isPublic}
          onCheckedChange={(checked) => handleShareSettingsChange('isPublic', checked)}
        />
      </div>
    </div>
  ), [shareSettings.isPublic, handleShareSettingsChange]);

  const permissionSection = useMemo(() => (
    <div className="space-y-4">
      <Label className="text-base font-medium">Permission</Label>
      <Select
        value={shareSettings.permission}
        onValueChange={(value: 'view' | 'edit' | 'comment') => handleShareSettingsChange('permission', value)}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select permission" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="view">Can view</SelectItem>
          <SelectItem value="edit">Can edit</SelectItem>
          <SelectItem value="comment">Can comment</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ), [shareSettings.permission, handleShareSettingsChange]);

  const emailShareSection = useMemo(() => (
    <div className="space-y-4">
      <Label className="text-base font-medium">Share via Email</Label>
      <div className="space-y-4">
        <div className="flex gap-2">
          <Input
            type="email"
            placeholder="Enter email address"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            className="flex-1"
          />
          <Select
            value={invitePermission}
            onValueChange={(value: 'view' | 'edit' | 'comment') => setInvitePermission(value)}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Permission" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="view">Can view</SelectItem>
              <SelectItem value="edit">Can edit</SelectItem>
              <SelectItem value="comment">Can comment</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Textarea
          placeholder="Add a personal message (optional)"
          value={shareMessage}
          onChange={(e) => setShareMessage(e.target.value)}
          className="min-h-[100px]"
        />
        
        <Button 
          onClick={handleShareByEmail}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Sending...
            </>
          ) : (
            <>
              <Mail className="w-4 h-4 mr-2" />
              Send Share Email
            </>
          )}
        </Button>
      </div>
    </div>
  ), [inviteEmail, invitePermission, shareMessage, isLoading, handleShareByEmail]);

  const sharedUsersSection = useMemo(() => (
    <div className="space-y-4">
      <Label className="text-base font-medium">Shared with</Label>
      <div className="space-y-3">
        {sharedUsers.map((user) => {
          const isOwner = documentOwnerId && user.id === documentOwnerId;
          return (
            <div key={user.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                  <span className="text-sm font-medium text-slate-600">
                    {user.avatar || user.email.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium">{user.email}</p>
                  <p className="text-xs text-slate-500">{isOwner ? 'owner' : 'collaborator'} access</p>
                </div>
              </div>
              {/* Only show Remove if current user is owner and user is not owner */}
              {currentUserId && documentOwnerId && currentUserId === documentOwnerId && user.id !== documentOwnerId && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-red-600"
                  onClick={() => handleRemoveUser(user.id)}
                >
                  Remove
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  ), [sharedUsers, handleRemoveUser, currentUserId, documentOwnerId]);

  const inviteSection = useMemo(() => (
    <div className="space-y-4">
      <Label className="text-base font-medium">Invite people</Label>
      <div className="flex gap-2">
        <Input
          type="email"
          placeholder="Enter email address"
          value={inviteEmail}
          onChange={(e) => setInviteEmail(e.target.value)}
          className="flex-1"
        />
        <Select
          value={invitePermission}
          onValueChange={(value: 'view' | 'edit' | 'comment') => setInvitePermission(value)}
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Permission" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="view">Can view</SelectItem>
            <SelectItem value="edit">Can edit</SelectItem>
            <SelectItem value="comment">Can comment</SelectItem>
          </SelectContent>
        </Select>
        <Button 
          onClick={handleInviteByEmail}
          disabled={isLoading}
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Invite"}
        </Button>
      </div>
    </div>
  ), [inviteEmail, invitePermission, isLoading, handleInviteByEmail]);

  const linkSection = useMemo(() => (
    <div className="space-y-4">
      <Label className="text-base font-medium">Share link</Label>
      <div className="flex gap-2">
        <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-md">
          <Link className="w-4 h-4 text-slate-400" />
          <span className="text-sm text-slate-600 truncate">{shareUrl}</span>
        </div>
        <Button variant="outline" size="icon" onClick={handleCopyLink}>
          <Copy className="w-4 h-4" />
        </Button>
      </div>
    </div>
  ), [shareUrl, handleCopyLink]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Share "{document.title}"</DialogTitle>
          <DialogDescription>
            Control who can access and edit your document.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="invite">Invite People</TabsTrigger>
            <TabsTrigger value="link">Share Link</TabsTrigger>
          </TabsList>
          
          <TabsContent value="invite" className="space-y-6">
            {publicSharingSection}
            {permissionSection}
            {emailShareSection}
            {sharedUsersSection}
          </TabsContent>
          
          <TabsContent value="link" className="space-y-6">
            {linkSection}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
