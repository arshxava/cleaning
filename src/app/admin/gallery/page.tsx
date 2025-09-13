'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { ExternalLink, Image as ImageIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

type CloudinaryImage = {
  public_id: string;
  secure_url: string;
  width: number;
  height: number;
  created_at: string;
};

export default function GalleryPage() {
  const { toast } = useToast();
  const [images, setImages] = useState<CloudinaryImage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/cloudinary/images');
        if (!response.ok) {
          throw new Error('Failed to fetch images from Cloudinary.');
        }
        const data = await response.json();
        setImages(data.resources || []);
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: (error as Error).message,
        });
      } finally {
        setLoading(false);
      }
    };
    fetchImages();
  }, [toast]);

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-headline font-bold">
          Image Gallery
        </h1>
        <p className="text-muted-foreground mt-2">
          Browse all images uploaded to your Cloudinary media library.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Media Library ({loading ? '...' : images.length})
          </CardTitle>
          <CardDescription>
            Images are sorted from newest to oldest.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square w-full" />
              ))}
            </div>
          ) : images.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {images.map((image) => (
                <div key={image.public_id} className="group relative">
                  <a
                    href={image.secure_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Image
                      src={image.secure_url}
                      alt={image.public_id}
                      width={300}
                      height={300}
                      className="aspect-square w-full rounded-lg object-cover transition-opacity group-hover:opacity-80 border"
                      unoptimized // Use this if Cloudinary URLs change frequently or have tokens
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                      <ExternalLink className="h-8 w-8 text-white" />
                    </div>
                  </a>
                  <Badge
                    variant="secondary"
                    className="absolute bottom-2 left-2"
                  >
                    {new Date(image.created_at).toLocaleDateString()}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground bg-slate-50 dark:bg-gray-800 py-12 rounded-md">
              <p>No images found in your Cloudinary media library.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
