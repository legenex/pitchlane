import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Upload, FileText, X, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { parseAsset } from '@/functions/parseAsset';

export default function Step3Upload({ clientId, onNext }) {
  const [assets, setAssets] = useState([]);
  const [uploading, setUploading] = useState(false);

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);

    for (const file of files) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const asset = await base44.entities.KnowledgeAsset.create({
        client_id: clientId,
        type: file.type.includes('pdf') ? 'pdf' : 'image',
        title: file.name,
        file_url,
        status: 'parsing',
      });
      setAssets(prev => [...prev, asset]);
      parseAsset({ asset_id: asset.id }).catch(() => {});
    }

    setUploading(false);
  };

  const removeAsset = (id) => setAssets(prev => prev.filter(a => a.id !== id));

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
      <div className="text-center mb-8">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Upload className="w-6 h-6 text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Upload your assets</h2>
        <p className="text-muted-foreground">PDFs, images, credentials — anything that tells your story.</p>
      </div>

      <label className="block border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/40 transition-colors mb-6">
        <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm font-medium">Click to upload files</p>
        <p className="text-xs text-muted-foreground mt-1">PDFs, JPG, PNG up to 20MB</p>
        <input type="file" multiple accept=".pdf,image/*" onChange={handleFiles} className="hidden" />
      </label>

      {uploading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <Loader2 className="w-4 h-4 animate-spin" /> Uploading...
        </div>
      )}

      {assets.length > 0 && (
        <div className="space-y-2 mb-6">
          {assets.map(asset => (
            <div key={asset.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border border-border">
              <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-sm flex-1 truncate">{asset.title}</span>
              <button onClick={() => removeAsset(asset.id)}>
                <X className="w-4 h-4 text-muted-foreground hover:text-destructive" />
              </button>
            </div>
          ))}
        </div>
      )}

      <Button onClick={() => onNext(assets)} className="w-full h-11">
        {assets.length > 0 ? `Continue with ${assets.length} asset${assets.length > 1 ? 's' : ''}` : 'Skip for now'}
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </motion.div>
  );
}