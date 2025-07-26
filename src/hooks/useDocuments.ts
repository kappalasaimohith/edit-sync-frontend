import { useState, useCallback, useRef, useEffect } from 'react';
import { documentApi, Document } from '../services/api';

export const useDocuments = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [currentDocument, setCurrentDocument] = useState<Document | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMounted = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const fetchDocuments = useCallback(async () => {
    if (!isMounted.current) return;
    
    try {
      setIsLoading(true);
      setError(null);
      const docs = await documentApi.getAll();
      if (isMounted.current) {
        setDocuments(docs);
      }
    } catch (err) {
      if (isMounted.current) {
        setError(err instanceof Error ? err.message : 'Failed to fetch documents');
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, []);

  const fetchDocument = useCallback(async (id: string) => {
    if (!isMounted.current) return;
    
    try {
      setIsLoading(true);
      setError(null);
      const doc = await documentApi.getById(id);
      if (isMounted.current) {
        setCurrentDocument(doc);
      }
      return doc;
    } catch (err) {
      if (isMounted.current) {
        setError(err instanceof Error ? err.message : 'Failed to fetch document');
      }
      throw err;
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, []);

  const createDocument = useCallback(async (title: string, content?: string) => {
    if (!isMounted.current) return;
    
    try {
      setIsLoading(true);
      setError(null);
      const newDoc = await documentApi.create({ title, content });
      if (isMounted.current) {
        setDocuments(prev => [...prev, newDoc]);
      }
      return newDoc;
    } catch (err) {
      if (isMounted.current) {
        setError(err instanceof Error ? err.message : 'Failed to create document');
      }
      throw err;
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, []);

  const updateDocument = useCallback(async (id: string, data: Partial<Document>) => {
    if (!isMounted.current) return;
    
    try {
      setIsLoading(true);
      setError(null);
      const updatedDoc = await documentApi.update(id, data);
      
      if (isMounted.current) {
        setDocuments(prev => prev.map(doc => 
          doc.id === id ? updatedDoc : doc
        ));
        
        if (currentDocument?.id === id) {
          setCurrentDocument(updatedDoc);
        }
      }
      
      return updatedDoc;
    } catch (err) {
      if (isMounted.current) {
        setError(err instanceof Error ? err.message : 'Failed to update document');
      }
      throw err;
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [currentDocument]);

  const deleteDocument = useCallback(async (id: string) => {
    if (!isMounted.current) return;
    
    try {
      setIsLoading(true);
      setError(null);
      await documentApi.delete(id);
      if (isMounted.current) {
        setDocuments(prev => prev.filter(doc => doc.id !== id));
        if (currentDocument?.id === id) {
          setCurrentDocument(null);
        }
      }
    } catch (err) {
      if (isMounted.current) {
        setError(err instanceof Error ? err.message : 'Failed to delete document');
      }
      throw err;
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [currentDocument]);

  const duplicateDocument = useCallback(async (id: string) => {
    if (!isMounted.current) return;
    
    try {
      setIsLoading(true);
      setError(null);
      const duplicatedDoc = await documentApi.duplicate(id);
      if (isMounted.current) {
        setDocuments(prev => [duplicatedDoc, ...prev]);
      }
      return duplicatedDoc;
    } catch (err) {
      if (isMounted.current) {
        setError(err instanceof Error ? err.message : 'Failed to duplicate document');
      }
      throw err;
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, []);

  const shareDocument = useCallback(async (id: string, userId: string) => {
    if (!isMounted.current) return;
    
    try {
      setIsLoading(true);
      setError(null);
      const updatedDoc = await documentApi.share(id, userId);
      if (isMounted.current) {
        setDocuments(prev => prev.map(doc => 
          doc.id === id ? updatedDoc : doc
        ));
        if (currentDocument?.id === id) {
          setCurrentDocument(updatedDoc);
        }
      }
      return updatedDoc;
    } catch (err) {
      if (isMounted.current) {
        setError(err instanceof Error ? err.message : 'Failed to share document');
      }
      throw err;
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [currentDocument]);

  return {
    documents,
    currentDocument,
    isLoading,
    error,
    fetchDocuments,
    fetchDocument,
    createDocument,
    updateDocument,
    deleteDocument,
    duplicateDocument,
    shareDocument,
  };
}; 