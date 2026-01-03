import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabaseClient';
import { Button } from '../ui/button';

interface Contestant {
  id: string;
  status: string;
  email: string;
}

interface ApprovalGateProps {
  roomType: 'audition' | 'main_show';
  onApplyToPerform: () => void;
  onJoinQueue: () => void;
}

export const ApprovalGate: React.FC<ApprovalGateProps> = ({ roomType, onApplyToPerform, onJoinQueue }) => {
  const { user } = useAuth();
  
  const { data: contestant, isLoading } = useQuery({
    queryKey: ['contestant', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('contestants')
        .select('*')
        .eq('user_id', user.id)
        .single();
        
      if (error) return null;
      return data as Contestant;
    },
    enabled: !!user?.id
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg p-4 shadow-lg animate-pulse">
        <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-300 rounded w-1/2"></div>
      </div>
    );
  }

  // If no contestant record exists, show apply button
  if (!contestant) {
    return (
      <div className="bg-white rounded-lg p-4 shadow-lg">
        <h3 className="font-semibold text-gray-800 mb-2">Not Registered</h3>
        <p className="text-gray-600 text-sm mb-4">
          You need to apply to perform before you can join the queue.
        </p>
        <Button 
          onClick={onApplyToPerform}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 text-white"
        >
          Apply to Perform
        </Button>
      </div>
    );
  }

  // If contestant is pending approval
  if (contestant.status === 'pending') {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="font-semibold text-yellow-800 mb-2">Pending Approval</h3>
        <p className="text-yellow-700 text-sm mb-4">
          Your application is under review. Please wait for approval before joining the queue.
        </p>
        <Button 
          onClick={onApplyToPerform}
          variant="outline"
          className="w-full border-yellow-300 text-yellow-700 hover:bg-yellow-100"
        >
          View Application Status
        </Button>
      </div>
    );
  }

  // If contestant is rejected
  if (contestant.status === 'rejected') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="font-semibold text-red-800 mb-2">Application Rejected</h3>
        <p className="text-red-700 text-sm mb-4">
          Your application was not approved. You can apply again after making improvements.
        </p>
        <Button 
          onClick={onApplyToPerform}
          variant="outline"
          className="w-full border-red-300 text-red-700 hover:bg-red-100"
        >
          Reapply
        </Button>
      </div>
    );
  }

  // If contestant is approved
  if (contestant.status === 'approved') {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h3 className="font-semibold text-green-800 mb-2">Approved Performer</h3>
        <p className="text-green-700 text-sm mb-4">
          You are approved to perform! Join the queue to audition for the stage.
        </p>
        <Button 
          onClick={onJoinQueue}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 text-white"
        >
          {roomType === 'audition' ? 'Audition Now' : 'Join Performance Queue'}
        </Button>
      </div>
    );
  }

  return null;
};