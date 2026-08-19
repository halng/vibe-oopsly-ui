import React, { useState, useEffect } from 'react';
import { UserCheck, X, Check, Trash2, Clock, ShieldAlert, Sparkles } from 'lucide-react';
import { CommunityJoinRequest } from '../types';
import { ApiService } from '../services/api';

interface CommunityRequestsModalProps {
  isOpen: boolean;
  communityId: string;
  communityName: string;
  onClose: () => void;
  onApproveSuccess: () => void;
}

export const CommunityRequestsModal: React.FC<CommunityRequestsModalProps> = ({
  isOpen,
  communityId,
  communityName,
  onClose,
  onApproveSuccess,
}) => {
  const [requests, setRequests] = useState<CommunityJoinRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && communityId) {
      loadRequests();
    }
  }, [isOpen, communityId]);

  const loadRequests = async () => {
    setIsLoading(true);
    const res = await ApiService.getCommunityJoinRequests(communityId);
    if (res.isSuccess && res.data) {
      setRequests(res.data);
    }
    setIsLoading(false);
  };

  const handleApprove = async (reqId: string) => {
    setProcessingId(reqId);
    const res = await ApiService.approveJoinRequest(communityId, reqId);
    if (res.isSuccess) {
      setRequests((prev) => prev.filter((r) => r.id !== reqId));
      onApproveSuccess();
    }
    setProcessingId(null);
  };

  const handleReject = async (reqId: string) => {
    setProcessingId(reqId);
    const res = await ApiService.rejectJoinRequest(communityId, reqId);
    if (res.isSuccess) {
      setRequests((prev) => prev.filter((r) => r.id !== reqId));
    }
    setProcessingId(null);
  };

  if (!isOpen) return null;

  return (
    <div
      id="community-requests-modal-overlay"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in"
      onClick={onClose}
    >
      <div
        id="community-requests-modal"
        data-testid="community-requests-modal"
        className="bg-white dark:bg-stone-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-stone-200/80 dark:border-stone-800 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 flex items-center justify-center font-bold">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">
                Join Requests
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Pending applicants for <strong className="text-stone-800 dark:text-stone-200">{communityName}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-xs text-stone-400">
            Loading join applications...
          </div>
        ) : requests.length === 0 ? (
          <div className="py-10 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-400 mx-auto">
              <Check className="w-6 h-6 text-emerald-500" />
            </div>
            <h3 className="text-sm font-bold text-stone-800 dark:text-stone-200">
              No pending applications
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              All member requests for this community have been approved or resolved.
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            {requests.map((req) => (
              <div
                key={req.id}
                id={`request-item-${req.id}`}
                data-testid={`request-item-${req.id}`}
                className="p-4 rounded-2xl border border-stone-200/80 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/40 flex flex-col gap-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={
                        req.avatarUrl ||
                        `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80`
                      }
                      alt={req.displayName}
                      className="w-10 h-10 rounded-full object-cover border border-stone-200 shadow-2xs"
                    />
                    <div>
                      <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100">
                        {req.displayName}
                      </h4>
                      {req.userEmail && (
                        <p className="text-[11px] text-stone-500">{req.userEmail}</p>
                      )}
                    </div>
                  </div>

                  <span className="text-[10px] text-stone-400 font-medium flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Pending
                  </span>
                </div>

                {req.message && (
                  <p className="text-xs text-stone-600 dark:text-stone-300 bg-white dark:bg-stone-900 p-2.5 rounded-xl border border-stone-200/60 dark:border-stone-800 italic">
                    "{req.message}"
                  </p>
                )}

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    id={`reject-req-${req.id}`}
                    data-testid={`btn-reject-req-${req.id}`}
                    disabled={processingId === req.id}
                    onClick={() => handleReject(req.id)}
                    className="px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-red-50 dark:hover:bg-red-950/50 text-red-600 dark:text-red-400 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Decline
                  </button>
                  <button
                    id={`approve-req-${req.id}`}
                    data-testid={`btn-approve-req-${req.id}`}
                    disabled={processingId === req.id}
                    onClick={() => handleApprove(req.id)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#8BC34A] hover:bg-[#7CB342] text-white text-xs font-bold shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Approve & Add</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-xs font-bold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
