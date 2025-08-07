import { useEffect, useRef, useCallback, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Share, Calendar, MoreVertical, Copy, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDocuments } from "@/hooks/useDocuments";
import { toast } from "@/hooks/use-toast";
import { Document } from '@/services/api';

interface DocumentListProps {
  isAuthenticated: boolean;
  onOpenDocument: (doc: Document) => void;
  onAuthRequired: () => void;
  showSharedOnly?: boolean;
  refreshTrigger?: number;
}

export const DocumentList = ({ 
  isAuthenticated, 
  onOpenDocument, 
  onAuthRequired,
  showSharedOnly = false,
  refreshTrigger
}: DocumentListProps) => {
  const { documents, isLoading, error, fetchDocuments, deleteDocument, duplicateDocument } = useDocuments();
  const hasFetched = useRef(false);
  const isMounted = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Fetch documents only once when authenticated
  useEffect(() => {
    if (isAuthenticated && isMounted.current) {
      fetchDocuments();
    }
  }, [isAuthenticated, showSharedOnly, fetchDocuments, refreshTrigger]); // Add showSharedOnly to dependencies

  // Filter documents based on showSharedOnly
  const filteredDocuments = useMemo(() => {
    if (!showSharedOnly) return documents;
    return documents.filter(doc => doc.collaborators?.length > 0);
  }, [documents, showSharedOnly]);

  const handleDocumentClick = useCallback((doc: Document) => {
    if (!isAuthenticated) {
      onAuthRequired();
      return;
    }
    onOpenDocument(doc);
  }, [isAuthenticated, onAuthRequired, onOpenDocument]);

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  const getFileTypeDisplay = useCallback((fileType?: string) => {
    if (!fileType) return 'DOC';
    switch (fileType.toLowerCase()) {
      case 'txt': return 'TXT';
      case 'md': return 'MD';
      case 'docx': return 'DOCX';
      default: return fileType.toUpperCase();
    }
  }, []);

  const handleDropdownClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  const handleDeleteDocument = useCallback(async (e: React.MouseEvent, docId: string) => {
    e.stopPropagation();
    try {
      await deleteDocument(docId);
      toast({
        title: "Document deleted",
        description: "The document has been successfully deleted.",
      });
    } catch (error: unknown) {
      const err = error as Error;
      toast({
        title: "Error",
        description: err.message || "Failed to delete document",
        variant: "destructive",
      });
    }
  }, [deleteDocument]);

  const handleDuplicateDocument = useCallback(async (e: React.MouseEvent, docId: string) => {
    e.stopPropagation();
    try {
      const duplicatedDoc = await duplicateDocument(docId);
      // Refresh the documents list to show the new document
      await fetchDocuments();
      
      toast({
        title: "Document duplicated",
        description: "A copy of the document has been created.",
      });
    } catch (error: unknown) {
      const err = error as Error;
      toast({
        title: "Error",
        description: err.message || "Failed to duplicate document",
        variant: "destructive",
      });
    }
  }, [duplicateDocument, fetchDocuments]);

  const renderDropdownMenu = useCallback((doc: Document) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={handleDropdownClick}
        >
          <MoreVertical className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem>Share</DropdownMenuItem>
        <DropdownMenuItem onClick={(e) => handleDuplicateDocument(e, doc._id || doc.id)}>
          <Copy className="w-4 h-4 mr-2" />
          Duplicate
        </DropdownMenuItem>
        <DropdownMenuItem>Export</DropdownMenuItem>
        <DropdownMenuItem 
          className="text-red-600"
          onClick={(e) => handleDeleteDocument(e, doc._id || doc.id)}
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ), [handleDropdownClick, handleDeleteDocument, handleDuplicateDocument]);

  const renderDocumentCard = useCallback((doc: Document) => (
    <Card 
      key={doc.id} 
      className="hover:shadow-md transition-all duration-200 cursor-pointer hover:border-slate-300 dark:hover:border-gray-700 bg-white dark:bg-gray-900 border border-border"
      onClick={() => handleDocumentClick(doc)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <FileText className="w-5 h-5 text-slate-600 dark:text-gray-400 mt-1" />
            <div>
              <CardTitle className="text-lg font-semibold text-slate-800 dark:text-gray-100">
                {doc.title}
              </CardTitle>
              <CardDescription className="flex items-center gap-4 mt-1 text-slate-600 dark:text-gray-300">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4 text-slate-600 dark:text-gray-400" />
                  {formatDate(doc.updatedAt)}
                </span>
                <span>{doc.collaborators?.length || 0} collaborator{doc.collaborators?.length !== 1 ? 's' : ''}</span>
                {doc.fileType && (
                  <Badge variant="outline" className="text-xs dark:text-gray-200">
                    {getFileTypeDisplay(doc.fileType)}
                  </Badge>
                )}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {doc.isPublic && (
              <Badge variant="secondary" className="flex items-center gap-1 dark:text-gray-200">
                <Share className="w-3 h-3" />
                Shared
              </Badge>
            )}
            {renderDropdownMenu(doc)}
          </div>
        </div>
      </CardHeader>
    </Card>
  ), [handleDocumentClick, renderDropdownMenu, formatDate, getFileTypeDisplay]);

  if (!isAuthenticated) {
    return (
      <div className="text-center py-12">
        <FileText className="w-16 h-16 mx-auto text-slate-400 mb-4" />
        <h3 className="text-xl font-semibold text-slate-600 mb-2">
          Sign in to view your documents
        </h3>
        <p className="text-slate-500 mb-6">
          Access your personal document library and shared collaborations
        </p>
        <Button onClick={onAuthRequired}>
          Sign In to Continue
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto"></div>
        <p className="text-slate-600 mt-4">Loading documents...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <FileText className="w-16 h-16 mx-auto text-red-400 mb-4" />
        <h3 className="text-xl font-semibold text-red-600 mb-2">
          Error loading documents
        </h3>
        <p className="text-slate-500 mb-6">
          {error}
        </p>
        <Button onClick={() => {
          hasFetched.current = false;
          fetchDocuments();
        }}>
          Try Again
        </Button>
      </div>
    );
  }

  if (filteredDocuments.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="w-16 h-16 mx-auto text-slate-400 mb-4" />
        <h3 className="text-xl font-semibold text-slate-600 mb-2">
          {showSharedOnly ? 'No shared documents' : 'No documents yet'}
        </h3>
        <p className="text-slate-500">
          {showSharedOnly 
            ? 'Documents shared with you will appear here'
            : 'Create your first document to get started'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {filteredDocuments.map(renderDocumentCard)}
    </div>
  );
};
