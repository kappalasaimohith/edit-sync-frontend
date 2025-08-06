import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import ResetPasswordDialog from '../components/ResetPasswordDialog';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(true);

  const handleClose = () => {
    setDialogOpen(false);
    navigate('/'); // Redirect to home or login after closing
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      {token ? (
        <ResetPasswordDialog token={token} onClose={handleClose} />
      ) : (
        <div className="p-8 bg-white rounded shadow">
          <h2 className="text-xl font-bold mb-4">Invalid or missing token</h2>
          <button className="btn" onClick={handleClose}>Go Home</button>
        </div>
      )}
    </div>
  );
}
