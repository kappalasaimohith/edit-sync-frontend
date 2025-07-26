# ✏️ Edit-Sync Frontend

**Edit-Sync** is a modern web application for collaborative document editing, built with Vite, React, TypeScript, Tailwind CSS, and ShadCN UI. It enables real-time editing, sharing, and management of documents with a sleek, responsive interface.

![Vite](https://img.shields.io/badge/Vite-4.x-blueviolet?logo=vite)
![React](https://img.shields.io/badge/React-18.x-61dafb?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.x-38bdf8?logo=tailwindcss)
![shadcn/ui](https://img.shields.io/badge/shadcn/ui-%20-lightgrey?logo=shadcnui\&logoColor=white)

## Features

* Real-time collaborative document editing
* User authentication and access control
* Document sharing with granular permissions
* Markdown support and live preview
* Responsive, modern UI with ShadCN components

## Getting Started

### Frontend

```bash
git clone https://github.com/kappalasaimohith/edit-sync-frontend
cd edit-sync-frontend
npm install
```

Create a `.env.local` file in the root of the frontend project and add the following:

```env
VITE_API_URL=http://localhost:5000/api
```

Then start the development server:

```bash
npm run dev
```


Open [http://localhost:8080](http://localhost:8080) to view the app in your browser.

### Backend

The backend is hosted in a **separate repository**. Clone it using:

```bash
git clone https://github.com/kappalasaimohith/edit-sync-backend
cd edit-sync-backend
npm install
npm start
```

This starts the backend server, running on [http://localhost:5000](http://localhost:5000).

## Tech Stack

* Vite
* React
* TypeScript
* Tailwind CSS
* [shadcn/ui](https://ui.shadcn.dev)
* Node.js (backend)
* Express

## Usage

* **Create an account** or log in
* **Create, edit, and share documents** with others
* **Manage access** via the document sharing dialog
* **Import/export** documents as needed
