import React from 'react';
import { Home, FileText, PlayCircle, BarChart3, History, User } from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  openAuthModal: () => void;
  isAuthenticated: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  setActiveTab,
  openAuthModal,
  isAuthenticated,
}) => {
  const items = [
    { id: 'dashboard', label: 'Home', icon: Home },
    { id: 'resume', label: 'Resume', icon: FileText },
    { id: 'practice', label: 'Practice', icon: PlayCircle },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'history', label: 'History', icon: History },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200 px-2 py-1 shadow-lg">
      <div className="flex items-center justify-around">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                if (item.id === 'profile' && !isAuthenticated) {
                  openAuthModal();
                } else {
                  setActiveTab(item.id);
                }
              }}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-colors min-w-[50px] ${
                isActive ? 'text-blue-600 font-semibold' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'text-blue-600 stroke-[2.4]' : 'text-gray-400'}`} />
              <span className="text-[10px] tracking-tight">{item.label}</span>
              {isActive && <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-0.5"></span>}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
