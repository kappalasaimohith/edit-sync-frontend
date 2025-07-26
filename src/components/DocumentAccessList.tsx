import { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { documentApi } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import { X, Loader2 } from "lucide-react";

interface DocumentAccessListProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: string;
  documentTitle: string;
  accessList: Array<{
    userId: string;
    email: string;
    name: string;
    role: 'owner' | 'editor' | 'viewer';
  }>;
  onAccessListChange: () => void;
}

export const DocumentAccessList = ({
  open,
  onOpenChange,
  documentId,
  documentTitle,
  accessList,
  onAccessListChange,
}: DocumentAccessListProps) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState<string | null>(null);

  // Separate owner and other users
  const owner = accessList.find(access => access.role === 'owner');
  const otherUsers = accessList.filter(access => access.role !== 'owner' && access.userId !== owner?.userId);
  const isCurrentUserOwner = owner?.userId === user?.id;

  const handleRemoveAccess = async (userId: string) => {
    if (!user || !isCurrentUserOwner) {
      toast({
        title: "Access Denied",
        description: "Only the document owner can remove collaborators",
        variant: "destructive",
      });
      return;
    }

    // Find the user to be removed
    const userToRemove = accessList.find(access => access.userId === userId);
    
    // Prevent removing the owner
    if (userToRemove?.role === 'owner' || userId === owner?.userId) {
      toast({
        title: "Cannot Remove Owner",
        description: "The document owner cannot be removed",
        variant: "destructive",
      });
      return;
    }

    // Prevent removing self
    if (userId === user.id) {
      toast({
        title: "Cannot Remove Self",
        description: "You cannot remove yourself from the document",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(userId);
    try {
      await documentApi.removeAccess(documentId, userId);
      toast({
        title: "Access Removed",
        description: "Collaborator has been removed from the document",
      });
      onAccessListChange();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove access. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(null);
    }
  };

  const renderOwnerCard = (access: typeof accessList[0]) => (
    <div
      key={access.userId}
      className="flex items-center justify-between p-2 rounded-lg border"
    >
      <div className="flex flex-col">
        <span className="font-medium">{access.name}</span>
        <span className="text-sm text-gray-500">{access.email}</span>
        <span className="text-xs text-gray-400 capitalize">{access.role}</span>
      </div>
    </div>
  );

  const renderCollaboratorCard = (access: typeof accessList[0]) => {
    // Only show remove button for non-owner collaborators when current user is the owner
    const showRemoveButton = isCurrentUserOwner && access.userId !== user?.id;

    return (
      <div
        key={access.userId}
        className="flex items-center justify-between p-2 rounded-lg border"
      >
        <div className="flex flex-col">
          <span className="font-medium">{access.name}</span>
          <span className="text-sm text-gray-500">{access.email}</span>
          <span className="text-xs text-gray-400 capitalize">{access.role}</span>
        </div>
        
        {showRemoveButton && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleRemoveAccess(access.userId)}
            disabled={isLoading === access.userId}
          >
            {isLoading === access.userId ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <X className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Document Access</DialogTitle>
          <DialogDescription>
            Manage access for "{documentTitle}"
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Owner section - always render owner card without remove button */}
          {owner && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-500">Owner</h3>
              {renderOwnerCard(owner)}
            </div>
          )}

          {/* Collaborators section - only render non-owner users */}
          {otherUsers.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-500">Collaborators</h3>
              {otherUsers.map(access => renderCollaboratorCard(access))}
            </div>
          )}

          {otherUsers.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-2">
              No other users have access to this document
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
