import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function BillingSuccess() {
  const [searchParams] = useSearchParams();
  const credits = searchParams.get('credits');

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full text-center space-y-6 p-8">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div>
          <h1 className="text-2xl font-bold mb-2">Payment Received</h1>
          <p className="text-muted-foreground">
            {credits
              ? `${parseInt(credits).toLocaleString()} credits have been added to your account.`
              : 'Your subscription has been activated.'}
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <Link to="/app">
            <Button className="w-full gap-2">Go to Dashboard <ArrowRight className="w-4 h-4" /></Button>
          </Link>
          <Link to="/app/prospects">
            <Button variant="outline" className="w-full">View Prospects</Button>
          </Link>
          <Link to="/app/artifacts">
            <Button variant="outline" className="w-full">View Artifacts</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}