import { useState, useEffect, useCallback, useMemo } from 'react';
// import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, FileText, Share, LogOut } from "lucide-react";
import { DocumentList } from "@/components/DocumentList";
import { DocumentEditor } from "@/components/DocumentEditor";
import { AuthDialog } from "@/components/AuthDialog";
import { AuthContext } from "@/contexts/AuthContext";
import { useDocuments } from "@/hooks/useDocuments";
import { toast } from "@/hooks/use-toast";
import { ImportDocumentDialog } from "@/components/ImportDocumentDialog";
import { Header } from "@/components/Header";
import { Document } from '@/services/api';
import { useContext } from 'react';

const Index = () => {
  const [currentView, setCurrentView] = useState<'dashboard' | 'editor'>('dashboard');
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showSharedDocuments, setShowSharedDocuments] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { isAuthenticated, logout, refreshAuthState } = useContext(AuthContext);
  const { createDocument, updateDocument, fetchDocument, fetchDocuments } = useDocuments();

  // Refresh documents when auth state changes
  useEffect(() => {
    if (isAuthenticated) {
      fetchDocuments();
    }
  }, [isAuthenticated, fetchDocuments, refreshTrigger]);

  const handleAuthRequired = useCallback(() => {
    setShowAuthDialog(true);
  }, []);

  const handleSignOut = useCallback(async () => {
    try {
      await logout();
      setRefreshTrigger(prev => prev + 1);
      setShowSharedDocuments(false);
      setSelectedDocument(null);
      setCurrentView('dashboard');
      toast({
        title: "Signed Out",
        description: "You have been signed out successfully.",
      });
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    }
  }, [logout]);

  const handleCreateDocument = useCallback(async () => {
    if (!isAuthenticated) {
      setShowAuthDialog(true);
      return;
    }
    try {
      const newDoc = await createDocument('Untitled Document', '# Welcome to your new document\n\nStart writing here...');
      if (newDoc && newDoc.id) {
        setSelectedDocument(newDoc);
        setCurrentView('editor');
        setRefreshTrigger(prev => prev + 1);
      } else {
        throw new Error('Failed to create document: No document ID returned');
      }
    } catch (error: unknown) {
      const err = error as Error;
      toast({
        title: "Error",
        description: err.message || "Failed to create document",
        variant: "destructive",
      });
    }
  }, [isAuthenticated, createDocument]);

  const handleOpenDocument = useCallback(async (doc: Document) => {
    if (!isAuthenticated) {
      handleAuthRequired();
      return;
    }
    try {
      const latestDoc = await fetchDocument(doc.id || doc._id);
      setSelectedDocument(latestDoc);
      setCurrentView('editor');
    } catch (error: unknown) {
      const err = error as Error;
      toast({
        title: "Error",
        description: err.message || "Failed to open document",
        variant: "destructive",
      });
    }
  }, [isAuthenticated, handleAuthRequired, fetchDocument]);

  const handleSaveDocument = useCallback(async (updatedDoc: Document) => {
    try {
      if (!updatedDoc.id) {
        toast({
          title: "Error",
          description: "Cannot save document: Missing document ID",
          variant: "destructive",
        });
        return;
      }

      const savedDoc = await updateDocument(updatedDoc.id, {
        title: updatedDoc.title,
        content: updatedDoc.content
      });
      
      setSelectedDocument(savedDoc);
      setRefreshTrigger(prev => prev + 1);
      
      toast({
        title: "Success",
        description: "Document saved successfully",
      });
    } catch (error: unknown) {
      const err = error as Error;
      toast({
        title: "Error",
        description: err.message || "Failed to save document",
        variant: "destructive",
      });
    }
  }, [updateDocument]);

  const handleBackToDashboard = useCallback(() => {
    setCurrentView('dashboard');
    setSelectedDocument(null);
    setRefreshTrigger(prev => prev + 1);
  }, []);

  const handleAuthDialogChange = useCallback((open: boolean) => {
    setShowAuthDialog(open);
  }, []);

  const handleAuthenticated = useCallback(async () => {
    try {
      setShowAuthDialog(false);
      await refreshAuthState();
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Auth refresh error:', error);
      toast({
        title: "Error",
        description: "Failed to refresh authentication state. Please try again.",
        variant: "destructive",
      });
    }
  }, [refreshAuthState]);

  const handleImportClick = useCallback(() => {
    setShowImportDialog(true);
  }, []);

  const handleImportSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleSharedDocumentsClick = useCallback(() => {
    if (!isAuthenticated) {
      toast({
        title: "Error",
        description: "You must be signed in to view shared documents.",
        variant: "destructive",
      });
      setShowAuthDialog(true);
      return;
    }
    setShowSharedDocuments(true);
  }, [isAuthenticated]);

  const quickActions = useMemo(() => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={handleCreateDocument}>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <PlusCircle className="h-8 w-8 text-blue-600" />
            <div>
              <h3 className="font-semibold">New Document</h3>
              <p className="text-sm text-slate-600">Create a blank document</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={handleImportClick}>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <FileText className="h-8 w-8 text-green-600" />
            <div>
              <h3 className="font-semibold">Import</h3>
              <p className="text-sm text-slate-600">Import existing documents</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={handleSharedDocumentsClick}>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <Share className="h-8 w-8 text-purple-600" />
            <div>
              <h3 className="font-semibold">Shared with Me</h3>
              <p className="text-sm text-slate-600">View shared documents</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  ), [handleCreateDocument, handleImportClick, handleSharedDocumentsClick]);

  const recentDocuments = useMemo(() => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        {isAuthenticated && (
            <div>
              <CardTitle>Recent Documents</CardTitle>
              <CardDescription>
                Your recently edited documents
              </CardDescription>
            </div>
          )}
          {/* {isAuthenticated && (
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          )} */}
      </CardHeader>
      <CardContent>
        <DocumentList 
          isAuthenticated={isAuthenticated}
          onOpenDocument={handleOpenDocument}
          onAuthRequired={handleAuthRequired}
          showSharedOnly={showSharedDocuments}
          refreshTrigger={refreshTrigger}
        />
      </CardContent>
    </Card>
  ), [isAuthenticated, handleOpenDocument, handleAuthRequired, showSharedDocuments, refreshTrigger]);

  if (currentView === 'editor' && selectedDocument) {
    return (
      <>
        <Header />
        <DocumentEditor
          document={selectedDocument}
          onBack={handleBackToDashboard}
          onSave={handleSaveDocument}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <div className="container mx-auto px-4 py-8">
        {quickActions}
        {recentDocuments}
      </div>

      <AuthDialog 
        open={showAuthDialog}
        onOpenChange={handleAuthDialogChange}
        onAuthenticated={handleAuthenticated}
      />

      <ImportDocumentDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        onImportSuccess={handleImportSuccess}
      />
    </div>
  );
};

export default Index;
