import React from 'react';
import { getStatusBadgeClass } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  children?: React.ReactNode;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  children
}) => {
  const badgeClass = getStatusBadgeClass(status);

  return (
    <span className={`status-badge ${badgeClass}`}>
      {children || status}
    </span>
  );
};