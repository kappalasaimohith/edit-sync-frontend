import { useState } from 'react';
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
import { toast } from "@/hooks/use-toast";
import { documentApi } from "@/services/api";
import { Copy } from "lucide-react";

interface DocumentShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: string;
  documentTitle: string;
  isOwner: boolean;
}

export const DocumentShareDialog = ({
  open,
  onOpenChange,
  documentId,
  documentTitle,
  isOwner,
}: DocumentShareDialogProps) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const documentUrl = `${window.location.origin}/documents/${documentId}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(documentUrl);
      toast({
        title: "Link Copied",
        description: "Document link has been copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy link to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleShare = async () => {
    if (!email) {
      toast({
        title: "Error",
        description: "Please enter an email address.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await documentApi.shareDocument(documentId, email, {
        message: `You have been granted access to the document "${documentTitle}". You can access it here: ${documentUrl}`
      });
      
      toast({
        title: "Document Shared",
        description: `The document has been shared with ${email}`,
      });
      
      onOpenChange(false);
      setEmail('');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to share the document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Share Document</DialogTitle>
          <DialogDescription>
            Share "{documentTitle}" with another user by entering their email address.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Document Link</Label>
            <div className="flex items-center space-x-2">
              <Input
                value={documentUrl}
                readOnly
                className="flex-1"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopyLink}
                title="Copy link"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <Button 
            onClick={handleShare} 
            className="w-full" 
            disabled={isLoading}
          >
            {isLoading ? "Sharing..." : "Share Document"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 