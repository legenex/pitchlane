import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Plus, Pencil, Trash2, Star } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import ReactQuill from 'react-quill';

export default function EmailSignaturesTab({ userId }) {
  const { toast } = useToast();
  const [signatures, setSignatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', html: '', is_default: false });

  useEffect(() => {
    if (!userId) return;
    loadSignatures();
  }, [userId]);

  const loadSignatures = async () => {
    const sigs = await base44.entities.EmailSignature.filter({ user_id: userId });
    setSignatures(sigs);
    setLoading(false);
  };

  const openNew = () => {
    setEditing(null);
    setForm({ name: '', html: '', is_default: false });
    setDialogOpen(true);
  };

  const openEdit = (sig) => {
    setEditing(sig);
    setForm({ name: sig.name, html: sig.html, is_default: sig.is_default });
    setDialogOpen(true);
  };

  const save = async () => {
    if (!form.name.trim() || !form.html.trim()) {
      toast({ title: 'Name and content required', variant: 'destructive' });
      return;
    }
    // If setting as default, unset others
    if (form.is_default) {
      await Promise.all(
        signatures.filter(s => s.is_default && s.id !== editing?.id)
          .map(s => base44.entities.EmailSignature.update(s.id, { is_default: false }))
      );
    }
    if (editing) {
      await base44.entities.EmailSignature.update(editing.id, { ...form });
    } else {
      await base44.entities.EmailSignature.create({ user_id: userId, ...form });
    }
    await loadSignatures();
    setDialogOpen(false);
    toast({ title: editing ? 'Signature updated' : 'Signature created' });
  };

  const remove = async (sig) => {
    await base44.entities.EmailSignature.delete(sig.id);
    setSignatures(prev => prev.filter(s => s.id !== sig.id));
    toast({ title: 'Signature deleted' });
  };

  const toggleDefault = async (sig) => {
    const newDefault = !sig.is_default;
    if (newDefault) {
      await Promise.all(
        signatures.filter(s => s.is_default && s.id !== sig.id)
          .map(s => base44.entities.EmailSignature.update(s.id, { is_default: false }))
      );
    }
    await base44.entities.EmailSignature.update(sig.id, { is_default: newDefault });
    await loadSignatures();
  };

  if (loading) return <p className="text-sm text-muted-foreground">Loading...</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Default signature is auto-appended to every email.</p>
        <Button size="sm" onClick={openNew} className="gap-1">
          <Plus className="w-3.5 h-3.5" /> New Signature
        </Button>
      </div>

      {signatures.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground border border-dashed rounded-xl">
          No signatures yet. Create one to get started.
        </div>
      ) : (
        <div className="space-y-3">
          {signatures.map(sig => (
            <Card key={sig.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{sig.name}</span>
                    {sig.is_default && (
                      <Badge variant="secondary" className="gap-1 text-xs">
                        <Star className="w-2.5 h-2.5" /> Default
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      Default
                      <Switch checked={sig.is_default} onCheckedChange={() => toggleDefault(sig)} />
                    </div>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openEdit(sig)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => remove(sig)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
                <div
                  className="text-sm text-muted-foreground border border-border rounded-lg p-3 bg-muted/30 max-h-24 overflow-hidden"
                  dangerouslySetInnerHTML={{ __html: sig.html }}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Signature' : 'New Signature'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Name</label>
              <Input
                placeholder="e.g. Default, Casual, Formal"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Content</label>
              <div className="border border-input rounded-md overflow-hidden">
                <ReactQuill
                  value={form.html}
                  onChange={html => setForm(f => ({ ...f, html }))}
                  style={{ minHeight: '150px' }}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={form.is_default}
                onCheckedChange={v => setForm(f => ({ ...f, is_default: v }))}
              />
              <label className="text-sm">Set as default signature</label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={save}>Save Signature</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}