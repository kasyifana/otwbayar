import React from 'react';
import { ActivityFeedItem } from '@/types';
import { timeAgo } from '@/lib/format';

interface ActivityFeedProps {
  activities: ActivityFeedItem[];
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ activities }) => {
  return (
    <div className="bg-white rounded-[20px] p-4 border border-[#E2E8DF] space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-[#172118]">
          Aktivitas Patungan
        </h3>
        <span className="text-[11px] text-[#576458]">Terkini</span>
      </div>

      <div className="space-y-2">
        {activities.slice(0, 5).map((act) => (
          <div
            key={act.id}
            className="text-xs text-[#172118] flex items-start gap-2 py-1.5 border-b border-[#EDF1EA] last:border-0"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#245229] mt-1.5 flex-shrink-0" />
            <div className="flex-1">
              <span className="font-semibold text-[#172118]">{act.actor_name}</span>{' '}
              <span className="text-[#576458]">{act.action}</span>
              <span className="text-[10px] text-[#576458] block font-tabular mt-0.5">
                {timeAgo(act.timestamp)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
