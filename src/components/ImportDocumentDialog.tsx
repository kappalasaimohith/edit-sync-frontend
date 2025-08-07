import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { documentApi } from "@/services/api";
import { Upload, Loader2 } from "lucide-react";

interface ImportDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportSuccess: () => void;
}

export const ImportDocumentDialog = ({
  open,
  onOpenChange,
  onImportSuccess,
}: ImportDocumentDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast({
        title: "Error",
        description: "Please select a file to import",
        variant: "destructive",
      });
      return;
    }

    const extension = file.name.split('.').pop()?.toLowerCase();
    let fileType = 'md';
    if (extension === 'txt') fileType = 'txt';
    else if (extension === 'md') fileType = 'md';
    // else if (extension === 'docx') fileType = 'docx';
    else {
      toast({
        title: "Error",
        description: "Unsupported file type. Please upload a .md or .txt file.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileType', fileType);

      await documentApi.importDocument(formData);
      
      toast({
        title: "Success",
        description: "Document imported successfully",
      });
      
      onImportSuccess();
      onOpenChange(false);
      setFile(null);
    } catch (error: unknown) {
      const err = error as Error;
      toast({
        title: "Error",
        description: err.message || "Failed to import document",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-background text-foreground">
        <DialogHeader>
          <DialogTitle>Import Document</DialogTitle>
          <DialogDescription>
            Import an existing document from your computer
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Input
              type="file"
              accept=".md,.txt"
              onChange={handleFileChange}
              disabled={isLoading}
            />
            <p className="text-sm text-gray-500">
              Supported formats: Markdown (.md), Text (.txt)  
            </p>
          </div>

          <Button
            className="w-full"
            onClick={handleImport}
            disabled={!file || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Import Document
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};