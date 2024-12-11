import { X } from 'lucide-react';
import React, { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';

interface RejectModalProps {
  rejectIsOpen: boolean;
  rejectOnClose: () => void;
  submissionId: string | undefined;
  applicantName: string | null | undefined;
  onRejectSubmission: (applicationId: string) => void;
}

export const RejectSubmissionModal = ({
  submissionId,
  rejectIsOpen,
  rejectOnClose,
  applicantName,
  onRejectSubmission,
}: RejectModalProps) => {
  const [loading, setLoading] = useState<boolean>(false);

  const rejectGrant = async () => {
    if (!submissionId) return;

    setLoading(true);
    try {
      await onRejectSubmission(submissionId);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      rejectOnClose();
    }
  };

  return (
    <Dialog open={rejectIsOpen} onOpenChange={rejectOnClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-md font-semibold text-slate-500">
            Reject Application
          </DialogTitle>
          <button
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity data-[state=open]:bg-accent data-[state=open]:text-muted-foreground hover:opacity-100 disabled:pointer-events-none"
            onClick={rejectOnClose}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        </DialogHeader>

        <Separator />

        <div className="text-[0.95rem] font-medium">
          <p className="mt-3 text-slate-500">
            You are about to reject {applicantName}’s submission request. They
            will be notified via email.
          </p>

          <br />

          <Button
            className="mb-3 w-full bg-[#E11D48] text-white hover:bg-[#E11D48]/90"
            disabled={loading}
            onClick={rejectGrant}
          >
            {loading ? (
              <>
                <span className="loading loading-spinner mr-2" />
                Rejecting
              </>
            ) : (
              <>
                <div className="mr-2 rounded-full bg-white p-[5px]">
                  <X className="h-2.5 w-2.5 text-[#E11D48]" />
                </div>
                Reject Application
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
