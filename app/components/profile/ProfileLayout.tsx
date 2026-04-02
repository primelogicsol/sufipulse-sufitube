import { ReactNode } from 'react';
import { Layout } from '../layout/Layout';
import { PageContainer } from '../layout/PageContainer';
import { Bell, FileText } from 'lucide-react';

export interface Notification {
  id: string;
  title: string;
  message: string;
  notification_type: string;
  read: boolean;
  created_at: string;
  action_url?: string;
  submission_reference?: string;
}

interface ProfileLayoutProps {
  loading: boolean;
  activeTab: 'submissions' | 'notifications';
  setActiveTab: (tab: 'submissions' | 'notifications') => void;
  notifications: Notification[];
  children: ReactNode;
}

export function ProfileLayout({
  loading,
  activeTab,
  setActiveTab,
  notifications,
  children
}: ProfileLayoutProps) {
  const unreadCount = notifications.filter(n => !n.read).length;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Layout>
      <PageContainer>
        <div className="py-16">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-white mb-2">My Profile</h1>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-4 mb-8 border-b border-neutral-800">
              <button
                onClick={() => setActiveTab('submissions')}
                className={`pb-4 px-4 font-semibold transition-colors relative ${activeTab === 'submissions'
                  ? 'text-white'
                  : 'text-neutral-400 hover:text-neutral-300'
                  }`}
              >
                <FileText className="w-5 h-5 inline-block mr-2" />
                Profile
                {activeTab === 'submissions' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white"></div>
                )}
              </button>
              <button
                onClick={() => setActiveTab('notifications')}
                className={`pb-4 px-4 font-semibold transition-colors relative ${activeTab === 'notifications'
                  ? 'text-white'
                  : 'text-neutral-400 hover:text-neutral-300'
                  }`}
              >
                <Bell className="w-5 h-5 inline-block mr-2" />
                Notifications
                {unreadCount > 0 && (
                  <span className="ml-2 px-2 py-1 text-xs bg-red-500 text-white rounded-full">
                    {unreadCount}
                  </span>
                )}
                {activeTab === 'notifications' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white"></div>
                )}
              </button>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                <p className="mt-4 text-neutral-400">Loading your Profile...</p>
              </div>
            ) : (
              <>
                {/* Submissions Tab */}
                {activeTab === 'submissions' && children}

                {/* Notifications Tab */}
                {activeTab === 'notifications' && (
                  <div className="space-y-4">
                    {notifications.length === 0 ? (
                      <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-12 text-center">
                        <Bell className="w-16 h-16 text-neutral-600 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-white mb-2">No notifications</h3>
                        <p className="text-neutral-400">
                          You will receive notifications here when there are updates to your submissions.
                        </p>
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`bg-neutral-900/50 border rounded-lg p-6 transition-colors ${notification.read
                            ? 'border-neutral-800'
                            : 'border-blue-500/30 bg-blue-500/5'
                            }`}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-lg font-semibold text-white">
                                  {notification.title}
                                </h3>
                                {!notification.read && (
                                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                )}
                              </div>
                              {notification.submission_reference && (
                                <p className="text-xs text-neutral-500 mb-2">
                                  {notification.submission_reference}
                                </p>
                              )}
                            </div>
                            <span className="text-sm text-neutral-400 whitespace-nowrap ml-4">
                              {formatDate(notification.created_at)}
                            </span>
                          </div>

                          <p className="text-neutral-300 mb-4">{notification.message}</p>

                          <div className="flex gap-3">
                            {notification.action_url && (
                              <a
                                href={notification.action_url}
                                className="px-4 py-2 bg-white text-black font-semibold rounded hover:bg-neutral-200 transition-colors text-sm"
                              >
                                View Details
                              </a>
                            )}
                            {!notification.read && (
                              <button
                                className="px-4 py-2 border border-neutral-700 text-neutral-300 font-semibold rounded hover:bg-neutral-800 transition-colors text-sm"
                              >
                                Mark as Read
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </PageContainer>
    </Layout>
  );
}
