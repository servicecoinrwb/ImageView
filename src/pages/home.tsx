import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { ObjectUploader } from "@/components/ObjectUploader";
import { apiRequest } from "@/lib/queryClient";
import type { Image } from "@shared/schema";
import type { UploadResult } from "@uppy/core";
import { Copy, ExternalLink, Trash2, Upload, Image as ImageIcon, Zap } from "lucide-react";

export default function Home() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploadingFiles, setUploadingFiles] = useState<string[]>([]);
  const [enableCompression, setEnableCompression] = useState<boolean>(true);

  // Fetch all uploaded images
  const { data: images = [], isLoading } = useQuery<Image[]>({
    queryKey: ["/api/images"],
  });

  // Mutation to create image record after upload
  const createImageMutation = useMutation({
    mutationFn: async (imageData: any) => {
      const response = await apiRequest("POST", "/api/images", imageData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/images"] });
      toast({
        title: "Success!",
        description: "Image uploaded successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation for compressed upload
  const compressedUploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await fetch('/api/images/upload-compressed', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/images"] });
      
      let description = "Image uploaded successfully";
      if (data.compressionSkipped) {
        description = "GIF uploaded successfully (animation preserved, no compression)";
      } else if (data.compressionFailed) {
        description = "Image uploaded successfully (compression failed, original used)";
      } else if (data.compressionRatio && parseFloat(data.compressionRatio) > 0) {
        description = `Image compressed by ${data.compressionRatio}% and uploaded successfully`;
      }
      
      toast({
        title: "Success!",
        description,
      });
    },
    onError: (error) => {
      toast({
        title: "Compression failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation to delete image
  const deleteImageMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/images/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/images"] });
      toast({
        title: "Deleted",
        description: "Image deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleGetUploadParameters = useCallback(async () => {
    const response = await apiRequest("POST", "/api/images/upload-url");
    const data = await response.json();
    return {
      method: "PUT" as const,
      url: data.uploadURL,
    };
  }, []);

  const handleUploadComplete = useCallback(
    (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
      result.successful?.forEach((file) => {
        if (file.uploadURL && file.meta) {
          // Extract image dimensions and other metadata
          const imageData = {
            filename: `${file.id}.${file.extension || 'jpg'}`,
            originalName: file.name,
            mimeType: file.type || 'image/jpeg',
            size: file.size,
            width: (file.meta.width as number) || null,
            height: (file.meta.height as number) || null,
            objectPath: file.uploadURL,
          };

          createImageMutation.mutate(imageData);
        }
      });

      // Clear uploading state
      setUploadingFiles([]);
    },
    [createImageMutation]
  );

  const copyToClipboard = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: "Copied!",
        description: "URL copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Failed to copy URL to clipboard",
        variant: "destructive",
      });
    }
  };

  const getImageUrl = (image: Image) => {
    return `${window.location.origin}${image.objectPath}`;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    // Process each file for compression upload
    Array.from(files).forEach((file) => {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not a supported image format`,
          variant: "destructive",
        });
        return;
      }

      // Validate file size (10MB)
      if (file.size > 10485760) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds the 10MB limit`,
          variant: "destructive",
        });
        return;
      }

      // Upload with compression
      compressedUploadMutation.mutate(file);
    });

    // Clear the input
    event.target.value = '';
  }, [compressedUploadMutation, toast]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <ImageIcon className="w-5 h-5 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-semibold text-foreground">ImageShare</h1>
            </div>
            <div className="hidden md:flex items-center space-x-4 text-sm text-muted-foreground">
              <span>Max file size: 10MB</span>
              <span>•</span>
              <span>PNG, JPG, GIF, WebP</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Upload Zone */}
          <div className="mb-8">
            <Card>
              <CardContent className="p-12">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
                    <Upload className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    Drop your images here
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    or click to browse from your device
                  </p>
                  
                  {/* Compression Toggle */}
                  <div className="mb-4 flex items-center justify-center space-x-2">
                    <Checkbox 
                      id="compression" 
                      checked={enableCompression}
                      onCheckedChange={(checked) => setEnableCompression(checked === true)}
                      data-testid="checkbox-compression"
                    />
                    <label htmlFor="compression" className="text-sm font-medium cursor-pointer flex items-center space-x-1">
                      <Zap className="w-4 h-4 text-orange-500" />
                      <span>Auto-compress images (recommended)</span>
                    </label>
                  </div>

                  {enableCompression ? (
                    /* Custom file input for compression */
                    <div>
                      <input
                        type="file"
                        id="file-upload"
                        multiple
                        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                        className="hidden"
                        onChange={handleFileInputChange}
                        data-testid="input-file-compress"
                      />
                      <Button
                        onClick={() => document.getElementById('file-upload')?.click()}
                        className="bg-orange-500 text-white hover:bg-orange-600"
                        disabled={compressedUploadMutation.isPending}
                        data-testid="button-upload-compress"
                      >
                        <Zap className="w-4 h-4 mr-2" />
                        {compressedUploadMutation.isPending ? 'Compressing...' : 'Choose Files (with compression)'}
                      </Button>
                    </div>
                  ) : (
                    <ObjectUploader
                      maxNumberOfFiles={10}
                      maxFileSize={10485760} // 10MB
                      onGetUploadParameters={handleGetUploadParameters}
                      onComplete={handleUploadComplete}
                      buttonClassName="bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      Choose Files
                    </ObjectUploader>
                  )}
                  
                  <div className="mt-4 text-xs text-muted-foreground">
                    <p>Supports PNG, JPG, GIF, WebP up to 10MB each</p>
                    {enableCompression && (
                      <p className="text-orange-600 mt-1">✨ Images will be automatically optimized to reduce file size</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Uploaded Images */}
          <div className="space-y-6">
            {isLoading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading images...</p>
              </div>
            ) : images.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
                  <ImageIcon className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">
                  No images uploaded yet
                </h3>
                <p className="text-muted-foreground">
                  Your uploaded images will appear here with shareable links
                </p>
              </div>
            ) : (
              images.map((image) => (
                <Card key={image.id} className="overflow-hidden shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <img
                        src={getImageUrl(image)}
                        alt={image.originalName}
                        className="w-24 h-24 object-cover rounded-md border border-border flex-shrink-0"
                        data-testid={`img-preview-${image.id}`}
                      />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-medium text-foreground truncate" data-testid={`text-filename-${image.id}`}>
                            {image.originalName}
                          </h4>
                          <div className="flex items-center text-xs text-muted-foreground">
                            <span data-testid={`text-size-${image.id}`}>{formatFileSize(image.size)}</span>
                            {image.width && image.height && (
                              <>
                                <span className="mx-1">•</span>
                                <span data-testid={`text-dimensions-${image.id}`}>
                                  {image.width}×{image.height}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        
                        {/* URL Display */}
                        <div className="bg-muted rounded-md p-3 mb-3">
                          <div className="flex items-center justify-between">
                            <span 
                              className="text-sm font-mono text-foreground truncate mr-2"
                              data-testid={`text-url-${image.id}`}
                            >
                              {getImageUrl(image)}
                            </span>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => copyToClipboard(getImageUrl(image))}
                              data-testid={`button-copy-${image.id}`}
                            >
                              <Copy className="w-3 h-3 mr-1" />
                              Copy
                            </Button>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            onClick={() => window.open(getImageUrl(image), '_blank')}
                            data-testid={`button-view-${image.id}`}
                          >
                            <ExternalLink className="w-3 h-3 mr-1" />
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteImageMutation.mutate(image.id)}
                            disabled={deleteImageMutation.isPending}
                            data-testid={`button-delete-${image.id}`}
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-sm text-muted-foreground mb-4 md:mb-0">
              <p>&copy; 2024 ImageShare. Simple, fast image sharing.</p>
            </div>
            <div className="flex items-center space-x-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors" data-testid="link-privacy">Privacy Policy</a>
              <a href="#" className="hover:text-foreground transition-colors" data-testid="link-terms">Terms of Service</a>
              <a href="#" className="hover:text-foreground transition-colors" data-testid="link-api">API</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
