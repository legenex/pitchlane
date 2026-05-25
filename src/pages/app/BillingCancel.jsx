import React from 'react';
import { Link } from 'react-router-dom';
import { XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function BillingCancel() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full text-center space-y-6 p-8">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <XCircle className="w-8 h-8 text-muted-foreground" />
          </div>
        </div>
        <div>
          <h1 className="text-2xl font-bold mb-2">Payment Cancelled</h1>
          <p className="text-muted-foreground">No charges were made. You can try again whenever you're ready.</p>
        </div>
        <Link to="/app/billing">
          <Button className="w-full">Return to Billing</Button>
        </Link>
      </div>
    </div>
  );
}