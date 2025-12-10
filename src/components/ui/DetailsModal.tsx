import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Database } from '@/types/supabase';

interface DetailsModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  content?: string;
  image?: string | null;
  gallery?: string[];
  metadata?: Record<string, any>;
}

export function DetailsModal({
  open,
  onClose,
  title,
  content,
  image,
  gallery,
  metadata,
}: DetailsModalProps) {
  return (
    <Modal isOpen={open} onClose={onClose} title={title || ''} size="xl">
      <div className="space-y-4">
        {image && (
          <div className="w-full h-56 md:h-72 bg-muted rounded overflow-hidden">
            <img src={image} alt={title} className="w-full h-full object-cover" />
          </div>
        )}

        <div className="prose max-w-full">
          {content ? (
            // content may contain HTML/rich text
            <div dangerouslySetInnerHTML={{ __html: content }} />
          ) : (
            <p className="text-sm text-muted-foreground">No details available.</p>
          )}
        </div>

        {gallery && gallery.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2">Photos</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {gallery.map((src, i) => (
                <div key={i} className="h-32 bg-muted rounded overflow-hidden">
                  <img src={src} alt={`photo-${i}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}

        {metadata && (
          <div className="text-sm text-muted-foreground space-y-1">
            {Object.entries(metadata).map(([k, v]) => (
              <div key={k} className="flex items-center justify-between">
                <span className="font-medium capitalize">{k.replace('_', ' ')}:</span>
                <span>{String(v)}</span>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end pt-4">
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </Modal>
  );
}

export default DetailsModal;
