import { Document } from './api';

export const generateShareEmailTemplate = (document: Document, senderName: string, permission: string, message?: string) => {
  const shareUrl = `https://docuflow.app/share/${document.id}`;
  
  return {
    subject: `${senderName} shared "${document.title}" with you`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Document Shared with You</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%);
              color: white;
              padding: 40px 20px;
              text-align: center;
              border-radius: 8px 8px 0 0;
            }
            .content {
              background: white;
              padding: 30px 20px;
              border: 1px solid #e5e7eb;
              border-top: none;
              border-radius: 0 0 8px 8px;
            }
            .button {
              display: inline-block;
              background: #4F46E5;
              color: white;
              padding: 12px 24px;
              text-decoration: none;
              border-radius: 6px;
              font-weight: 500;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              padding: 20px;
              color: #6B7280;
              font-size: 14px;
            }
            .permission-badge {
              display: inline-block;
              background: #F3F4F6;
              padding: 4px 12px;
              border-radius: 20px;
              font-size: 14px;
              color: #4B5563;
              margin: 10px 0;
            }
            .message {
              background: #F9FAFB;
              padding: 15px;
              border-radius: 6px;
              margin: 15px 0;
              font-style: italic;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Document Shared with You</h1>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p><strong>${senderName}</strong> has shared a document with you:</p>
              <h2>${document.title}</h2>
              ${message ? `
                <div class="message">
                  <p>${message}</p>
                </div>
              ` : ''}
              <div class="permission-badge">
                You have <strong>${permission}</strong> access
              </div>
              <p>Click the button below to view the document:</p>
              <div style="text-align: center;">
                <a href="${shareUrl}" class="button">View Document</a>
              </div>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #6B7280;">${shareUrl}</p>
              <p>This document was shared with you using DocuFlow, a collaborative document editing platform.</p>
            </div>
            <div class="footer">
              <p>This is an automated message, please do not reply directly to this email.</p>
              <p>&copy; ${new Date().getFullYear()} DocuFlow. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `
  };
}; 