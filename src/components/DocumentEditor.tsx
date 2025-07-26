import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, Share, Download, Eye, Edit3, Timer } from "lucide-react";
import { MarkdownPreview } from "./MarkdownPreview";
import { PlainTextPreview } from "./PlainTextPreview";
import DocxPreview from "./DocxPreview";
import { ShareDialog } from "./ShareDialog";
import { toast } from "@/hooks/use-toast";
import { Document as DocumentType } from "@/services/api";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const ConfirmDialog = ({
  open,
  onCancel,
  onConfirm,
  title = "Discard changes?",
  description = "You have unsaved changes. Are you sure you want to go back?",
}: {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
}) => (
  <Dialog open={open} onOpenChange={onCancel}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
      </DialogHeader>
      <p className="text-sm text-gray-600">{description}</p>
      <DialogFooter className="mt-4">
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button variant="destructive" onClick={onConfirm}>Leave</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

interface DocumentEditorProps {
  document: DocumentType;
  onBack: () => void;
  onSave: (doc: DocumentType) => void;
}

export const DocumentEditor = ({ document, onBack, onSave }: DocumentEditorProps) => {
  const [title, setTitle] = useState(document.title);
  const [content, setContent] = useState<string | ArrayBuffer>(document.content || "");
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isAutosaveEnabled, setIsAutosaveEnabled] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const fileType = useMemo(() => {
    // First check if document has fileType set
    if (document.fileType) {
      return document.fileType.toLowerCase();
    }
    
    // Fallback: try to determine from title extension
    const extensionFromTitle = document.title.split('.').pop()?.toLowerCase() || '';
    if (extensionFromTitle === 'txt') {
      return 'txt';
    } else if (extensionFromTitle === 'md') {
      return 'md';
    }
    
    // Default to markdown for backward compatibility
    return 'md';
  }, [document]);
  
  const isDocx = fileType === 'docx';
  const isMarkdown = fileType === 'md';
  const isPlainTxt = fileType === 'txt';

  const contentAsString = useMemo(() => {
    if (typeof content === 'string') return content;
    if (content instanceof ArrayBuffer) return arrayBufferToBase64(content);
    return '';
  }, [content]);

  const handleBack = useCallback(() => {
    if (hasUnsavedChanges) {
      setShowConfirmDialog(true);
    } else {
      onBack();
    }
  }, [hasUnsavedChanges, onBack]);

  const handleConfirmLeave = useCallback(() => {
    setShowConfirmDialog(false);
    onBack();
  }, [onBack]);

  const handleCancelLeave = useCallback(() => {
    setShowConfirmDialog(false);
  }, []);

  const handleSave = useCallback(() => {
    const docId = document.id || document._id;
    if (!docId) {
      toast({
        title: "Error",
        description: "Cannot save document: Missing document ID",
        variant: "destructive",
      });
      return;
    }

    const updatedDoc: DocumentType = {
      ...document,
      id: docId,
      _id: docId,
      title,
      content: contentAsString,
      fileType,
      lastModified: new Date().toISOString(),
    };

    onSave(updatedDoc);
    setHasUnsavedChanges(false);
  }, [document, title, contentAsString, fileType, onSave]);

  useEffect(() => {
    const hasChanges = title !== document.title || contentAsString !== document.content;
    setHasUnsavedChanges(hasChanges);
  }, [title, contentAsString, document]);

  useEffect(() => {
    if (!isAutosaveEnabled || !hasUnsavedChanges) return;
    const timer = setTimeout(() => {
      handleSave();
    }, 200);
    return () => clearTimeout(timer);
  }, [title, contentAsString, isAutosaveEnabled, hasUnsavedChanges, handleSave]);

  const handleExport = useCallback(() => {
    if (typeof content !== 'string') {
      toast({
        title: "Export unavailable",
        description: "Only text and markdown documents can be exported.",
        variant: "destructive",
      });
      return;
    }

    // Determine the correct file extension based on the document's fileType
    let ext: string;
    let mimeType: string;
    
    if (isMarkdown) {
      ext = 'md';
      mimeType = 'text/markdown';
    } else if (isPlainTxt) {
      ext = 'txt';
      mimeType = 'text/plain';
    } else {
      // Fallback: check if the title has an extension
      const extensionFromTitle = title.split('.').pop()?.toLowerCase() || '';
      if (extensionFromTitle === 'txt') {
        ext = 'txt';
        mimeType = 'text/plain';
      } else {
        // Default to markdown if we can't determine the type
        ext = 'md';
        mimeType = 'text/markdown';
      }
    }
    
    console.log(`Exporting as ${ext} file`);
    console.log(`Document fileType: ${fileType}`);

    const blob = new Blob([content], { type: mimeType });
    const a = window.document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${title}.${ext}`;
    window.document.body.appendChild(a);
    a.click();
    window.document.body.removeChild(a);

    // toast({
    //   title: "Exported",
    //   description: `${ext.toUpperCase()} file downloaded.`,
    // });
  }, [content, title, isMarkdown, isPlainTxt, fileType]);

  const header = (
    <div className="bg-white border-b border-slate-200">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={handleBack} className="flex gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div className="flex items-center gap-3">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Document title"
                className="text-xl font-semibold border-none bg-transparent"
              />
              {hasUnsavedChanges && !isAutosaveEnabled && (
                <Badge variant="secondary">Unsaved</Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                id="autosave"
                checked={isAutosaveEnabled}
                onCheckedChange={setIsAutosaveEnabled}
              />
              <Label htmlFor="autosave" className="text-sm text-slate-600 flex items-center gap-1">
                <Timer className="w-4 h-4" />
                Autosave
              </Label>
            </div>

            <Button variant="ghost" size="sm" onClick={() => setIsPreviewMode(p => !p)} disabled={isDocx}>
              {isPreviewMode ? <Edit3 className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {isPreviewMode ? "Edit" : "Preview"}
            </Button>

            <Button variant="ghost" size="sm" onClick={() => setShowShareDialog(true)}>
              <Share className="w-4 h-4" />
              Share
            </Button>

            <Button variant="ghost" size="sm" onClick={handleExport} disabled={isDocx}>
              <Download className="w-4 h-4" />
              Export
            </Button>

            <Button
              onClick={handleSave}
              disabled={!hasUnsavedChanges || isAutosaveEnabled}
              className="flex gap-2"
            >
              <Save className="w-4 h-4" />
              Save
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  const editorContent = (
    <div className="container mx-auto px-4 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-200px)]">
        {!isPreviewMode && !isDocx && (
          <Card className="p-6">
            <Textarea
              value={typeof content === "string" ? content : ""}
              onChange={(e) => setContent(e.target.value)}
              placeholder={
                isPlainTxt 
                  ? "Start writing your text document..." 
                  : "Start writing your document in Markdown..."
              }
              className="w-full h-full border-none resize-none focus:ring-0 text-base font-mono"
            />
          </Card>
        )}
        <Card className={`p-6 ${isPreviewMode || isDocx ? 'col-span-full' : ''}`}>
          {isDocx ? (
            typeof content !== "string" ? (
              <DocxPreview content={content} />
            ) : (
              <p className="text-gray-500">Invalid DOCX content.</p>
            )
          ) : isPlainTxt ? (
            <PlainTextPreview content={typeof content === "string" ? content : ""} />
          ) : (
            <MarkdownPreview content={typeof content === "string" ? content : ""} />
          )}
        </Card>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {header}
      {editorContent}
      <ShareDialog
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
        document={{
          id: document._id || document.id,
          _id: document._id || document.id,
          title,
          content: contentAsString,
          fileType,
        }}
      />
      <ConfirmDialog
        open={showConfirmDialog}
        onCancel={handleCancelLeave}
        onConfirm={handleConfirmLeave}
      />
    </div>
  );
};