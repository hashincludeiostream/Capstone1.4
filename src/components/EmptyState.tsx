import React from 'react';
import { Inbox, Store, Calendar, Users, FileText, RefreshCw } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  variant?: 'default' | 'salon' | 'appointments' | 'services' | 'staff';
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  variant = 'default'
}) => {
  const variantStyles = {
    default: 'bg-purple-100 text-purple-600',
    salon: 'bg-pink-100 text-pink-600',
    appointments: 'bg-blue-100 text-blue-600',
    services: 'bg-amber-100 text-amber-600',
    staff: 'bg-green-100 text-green-600'
  };

  const variantIcons = {
    default: <Inbox className="w-12 h-12" />,
    salon: <Store className="w-12 h-12" />,
    appointments: <Calendar className="w-12 h-12" />,
    services: <FileText className="w-12 h-12" />,
    staff: <Users className="w-12 h-12" />
  };

  return (
    <div className="text-center py-16 px-6">
      <div className={`w-16 h-16 rounded-2xl ${variantStyles[variant]} flex items-center justify-center mx-auto mb-4`}>
        {icon || variantIcons[variant]}
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-sm font-semibold shadow-md shadow-purple-500/20 transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          {action.label}
        </button>
      )}
    </div>
  );
};