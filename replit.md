# Image Upload and Management Application

## Overview

A full-stack web application for uploading, managing, and sharing images with a modern React frontend and Express.js backend. The application provides a clean interface for users to upload images, view them in a gallery format, and manage their uploads. It features direct-to-cloud storage uploads, public image serving, and a responsive design built with modern web technologies.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern component patterns
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management and caching
- **UI Components**: Shadcn/ui component library with Radix UI primitives for accessible, customizable components
- **Styling**: Tailwind CSS with CSS variables for consistent theming and responsive design
- **Build Tool**: Vite for fast development and optimized production builds

### Backend Architecture
- **Framework**: Express.js with TypeScript for robust API development
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **File Storage**: Google Cloud Storage for scalable object storage with direct upload capabilities
- **API Design**: RESTful endpoints with proper error handling and logging middleware

### Data Storage
- **Database**: PostgreSQL hosted on Neon Database for reliable, serverless database management
- **Schema Management**: Drizzle Kit for database migrations and schema synchronization
- **Object Storage**: Google Cloud Storage with Replit sidecar integration for secure file uploads
- **Memory Storage**: In-memory fallback storage implementation for development and testing

### File Upload Architecture
- **Direct Upload Pattern**: Frontend obtains presigned URLs from backend, uploads directly to Google Cloud Storage
- **Upload Component**: Uppy.js integration for sophisticated file upload UI with progress tracking
- **ACL Management**: Custom object access control system for managing file permissions
- **Public Serving**: Images served through `/objects/*` route with proper content delivery

### Database Schema
- **Users Table**: Basic user management with username and password fields
- **Images Table**: Comprehensive image metadata including filename, size, dimensions, MIME type, and object storage path
- **Relationships**: Clean separation between user and image entities for future extension

### Authentication & Security
- **Session Management**: Cookie-based sessions with credential inclusion in API requests
- **File Validation**: Client and server-side file type and size validation
- **CORS Configuration**: Proper cross-origin request handling for secure API access

### Development Environment
- **Hot Reload**: Vite HMR for instant frontend updates during development
- **Error Handling**: Comprehensive error boundaries and server error middleware
- **Logging**: Request logging with timing and response capture for debugging
- **TypeScript**: End-to-end type safety across frontend, backend, and shared schemas

## External Dependencies

### Cloud Services
- **Neon Database**: PostgreSQL database hosting with serverless architecture
- **Google Cloud Storage**: Object storage service integrated through Replit sidecar for file uploads and serving
- **Replit Sidecar**: Authentication and credential management for Google Cloud services

### Core Libraries
- **@tanstack/react-query**: Server state management and caching
- **drizzle-orm & @neondatabase/serverless**: Database ORM and connection management
- **@uppy/core, @uppy/dashboard, @uppy/aws-s3**: File upload handling with rich UI
- **@radix-ui/***: Accessible UI primitive components
- **wouter**: Lightweight React routing
- **zod**: Runtime type validation and schema definition

### Development Tools
- **Vite**: Build tool and development server
- **TypeScript**: Static type checking across the application
- **Tailwind CSS**: Utility-first CSS framework
- **ESBuild**: Fast JavaScript bundling for production builds