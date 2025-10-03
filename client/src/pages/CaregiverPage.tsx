import { useEffect } from 'react';
import { User } from 'lucide-react';
import { useContentStore } from '../store/contentStore';
import ContentDisplay from '../components/ContentDisplay';
import SearchBar from '../components/SearchBar';
import TabNavigation from '../components/TabNavigation';
import LoadingSpinner from '../components/LoadingSpinner';

export default function CaregiverPage() {
  const {
    content,
    loading,
    error,
    setCurrentPage,
    currentTabId
  } = useContentStore();

  useEffect(() => {
    setCurrentPage('caregiver');
  }, [setCurrentPage]);

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="error-message">Error: {error}</div>;
  if (!content) return <div className="error-message">No content available</div>;

  const pageData = content.pages['caregiver'];
  if (!pageData) return <div className="error-message">Caregiver content not found</div>;

  const currentTab = pageData.tabs.find(tab => tab.id === currentTabId);

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title">
          <User size={32} />
          <h1>Rage4Info for Care Givers</h1>
        </div>
        <p className="page-description">
          {pageData.description || 'Comprehensive resources and information for professional and family caregivers.'}
        </p>
      </div>

      <SearchBar />

      <TabNavigation tabs={pageData.tabs} />

      {currentTab && (
        <div className="tab-content">
          <ContentDisplay sections={currentTab.sections} />
        </div>
      )}
    </div>
  );
}