import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Settings, Search, FileText, Folder, FolderOpen,
  LogOut, Download, Upload, Loader, Check, AlertCircle,
  Edit3, GripVertical, Plus, Trash2
} from 'lucide-react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useContentStore } from '../store/contentStore';
import { Editor } from '@tinymce/tinymce-react';
import type { Tab, Section, ContentItem, LandingPageConfig } from '../../../shared/types';
import { useUnsavedChanges } from '../hooks/useUnsavedChanges';
import { useAutoSave } from '../hooks/useAutoSave';
import DraggableTreeItem from '../components/DraggableTreeItem';
import '../styles/admin-v2.css';

type SelectedItem = {
  type: 'tab' | 'section' | 'item';
  data: Tab | Section | ContentItem;
  tabId?: string;
  sectionId?: string;
};

export default function AdminPage() {
  const navigate = useNavigate();
  const {
    content,
    saveContent,
    addTab,
    updateTab,
    deleteTab,
    addSection,
    updateSection,
    deleteSection,
    addContentItem,
    updateContentItem,
    deleteContentItem,
    reorderTabs,
    reorderSections,
    reorderContentItems,
    updateLandingPage
  } = useContentStore();

  const [selectedPage, setSelectedPage] = useState('caregiver');
  const [selectedItem, setSelectedItem] = useState<SelectedItem | null>(null);
  const [editingData, setEditingData] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedTabs, setExpandedTabs] = useState<Set<string>>(new Set());
  const [isLoadingItem, setIsLoadingItem] = useState(false);
  const [landingPageData, setLandingPageData] = useState<LandingPageConfig | null>(null);

  // Initialize landing page data when content loads or page changes
  useEffect(() => {
    if (selectedPage === 'landing' && content) {
      const defaultLanding: LandingPageConfig = {
        heroTitle: 'Welcome to RAGE4INFO',
        heroSubtitle: 'Your comprehensive resource for caregiving information and support',
        caregiverCard: {
          title: 'INFO4 Caregivers',
          description: 'Access resources, training materials, and support tools designed specifically for professional and family caregivers.',
          buttonText: 'Explore Caregiver Resources'
        },
        careRecipientCard: {
          title: 'INFO4 People with Disabilities',
          description: 'Find information about care options, support services, and resources to help maintain independence and quality of life.',
          buttonText: 'Explore Care Recipient Resources'
        }
      };
      setLandingPageData(content.landingPage || defaultLanding);
    }
  }, [selectedPage, content]);

  // Auto-save functionality
  const saveCurrentItem = useCallback(async () => {
    if (!selectedItem || !editingData || !content) return;

    const currentPageData = content.pages[selectedPage];
    if (!currentPageData) return;

    try {
      switch (selectedItem.type) {
        case 'tab':
          if (currentPageData.tabs.find(t => t.id === editingData.id)) {
            updateTab(selectedPage, editingData.id, editingData);
          } else {
            addTab(selectedPage, editingData);
          }
          break;
        case 'section':
          if (selectedItem.tabId) {
            if (currentPageData.tabs.find(t => t.id === selectedItem.tabId)?.sections.find(s => s.id === editingData.id)) {
              updateSection(selectedPage, selectedItem.tabId, editingData.id, editingData);
            } else {
              addSection(selectedPage, selectedItem.tabId, editingData);
            }
          }
          break;
        case 'item':
          if (selectedItem.tabId && selectedItem.sectionId) {
            if (currentPageData.tabs.find(t => t.id === selectedItem.tabId)?.sections.find(s => s.id === selectedItem.sectionId)?.items.find(i => i.id === editingData.id)) {
              updateContentItem(selectedPage, selectedItem.tabId, selectedItem.sectionId, editingData.id, editingData);
            } else {
              addContentItem(selectedPage, selectedItem.tabId, selectedItem.sectionId, editingData);
            }
          }
          break;
      }
    } catch (error) {
      console.error('Save failed:', error);
      throw error;
    }
  }, [selectedItem, editingData, selectedPage, content, updateTab, addTab, updateSection, addSection, updateContentItem, addContentItem]);

  const { saveStatus, hasChanges } = useAutoSave(
    saveCurrentItem,
    editingData,
    2000
  );

  useUnsavedChanges(hasChanges);


  // Handle item selection
  const handleItemSelect = useCallback((item: SelectedItem) => {
    setIsLoadingItem(true);
    setSelectedItem(item);
    setEditingData({ ...item.data });

    // Auto-expand parent tab if selecting section or item
    if (item.type === 'section' || item.type === 'item') {
      if (item.tabId) {
        setExpandedTabs(prev => new Set(prev).add(item.tabId!));
      }
    }

    // Clear loading state after brief delay (covers 2000ms debounce + ~200ms save)
    setTimeout(() => setIsLoadingItem(false), 2500);
  }, []);

  // Toggle tab expansion
  const toggleTabExpansion = useCallback((tabId: string) => {
    setExpandedTabs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(tabId)) {
        newSet.delete(tabId);
      } else {
        newSet.add(tabId);
      }
      return newSet;
    });
  }, []);

  // Create new tab
  const handleNewTab = useCallback(() => {
    const currentPageData = content?.pages[selectedPage];
    const newTab: Tab = {
      id: `tab-${Date.now()}`,
      title: 'New Tab',
      sections: [],
      order: currentPageData?.tabs.length || 0,
      visible: true
    };
    addTab(selectedPage, newTab);
    handleItemSelect({ type: 'tab', data: newTab });
  }, [selectedPage, content, addTab, handleItemSelect]);

  // Create new section
  const handleNewSection = useCallback((tabId: string) => {
    const currentPageData = content?.pages[selectedPage];
    const tab = currentPageData?.tabs.find(t => t.id === tabId);
    const newSection: Section = {
      id: `section-${Date.now()}`,
      title: 'New Section',
      items: [],
      order: tab?.sections.length || 0,
      collapsible: true,
      expanded: false,
      visible: true
    };
    addSection(selectedPage, tabId, newSection);
    handleItemSelect({ type: 'section', data: newSection, tabId });
    setExpandedTabs(prev => new Set(prev).add(tabId));
  }, [selectedPage, content, addSection, handleItemSelect]);

  // Create new content item
  const handleNewItem = useCallback((tabId: string, sectionId: string) => {
    const currentPageData = content?.pages[selectedPage];
    const section = currentPageData?.tabs.find(t => t.id === tabId)?.sections.find(s => s.id === sectionId);
    const newItem: ContentItem = {
      id: `item-${Date.now()}`,
      title: 'New Content Item',
      content: '',
      sources: '',
      lastUpdated: new Date().toISOString(),
      order: section?.items.length || 0,
      visible: true
    };
    addContentItem(selectedPage, tabId, sectionId, newItem);
    handleItemSelect({ type: 'item', data: newItem, tabId, sectionId });
  }, [selectedPage, content, addContentItem, handleItemSelect]);

  // Delete current item
  const handleDelete = useCallback(() => {
    if (!selectedItem) return;

    const confirmMsg = `Are you sure you want to delete this ${selectedItem.type}? This cannot be undone.`;
    if (!window.confirm(confirmMsg)) return;

    switch (selectedItem.type) {
      case 'tab':
        deleteTab(selectedPage, selectedItem.data.id);
        break;
      case 'section':
        if (selectedItem.tabId) {
          deleteSection(selectedPage, selectedItem.tabId, selectedItem.data.id);
        }
        break;
      case 'item':
        if (selectedItem.tabId && selectedItem.sectionId) {
          deleteContentItem(selectedPage, selectedItem.tabId, selectedItem.sectionId, selectedItem.data.id);
        }
        break;
    }
    setSelectedItem(null);
    setEditingData(null);
  }, [selectedItem, selectedPage, deleteTab, deleteSection, deleteContentItem]);

  // Check authentication
  useEffect(() => {
    const isAdmin = localStorage.getItem('isAdmin');
    if (!isAdmin) {
      navigate('/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('isAdmin');
    navigate('/');
  };

  const handleExport = () => {
    if (!content) return;
    const dataStr = JSON.stringify(content, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = 'content-backup.json';

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedContent = JSON.parse(event.target?.result as string);
        saveContent(importedContent);
        alert('Content imported successfully!');
      } catch (error) {
        alert('Failed to import content. Please check the file format.');
      }
    };
    reader.readAsText(file);
  };

  if (!content) return <div>Loading...</div>;

  // For landing page, we don't need pageData
  const pageData = selectedPage !== 'landing' ? content.pages[selectedPage] : null;
  if (selectedPage !== 'landing' && !pageData) return <div>Page not found</div>;

  // Filter content based on search term (only for non-landing pages)
  const filteredContent = useMemo(() => {
    if (!pageData) return null;
    if (!searchTerm.trim()) return pageData;

    const searchLower = searchTerm.toLowerCase();
    const filteredTabs = pageData.tabs.map(tab => {
      const tabMatches = tab.title.toLowerCase().includes(searchLower);
      const filteredSections = tab.sections.map(section => {
        const sectionMatches = section.title.toLowerCase().includes(searchLower);
        const filteredItems = section.items.filter(item =>
          item.title.toLowerCase().includes(searchLower) ||
          item.content.toLowerCase().includes(searchLower)
        );

        if (sectionMatches || filteredItems.length > 0) {
          return { ...section, items: filteredItems };
        }
        return null;
      }).filter(Boolean);

      if (tabMatches || filteredSections.length > 0) {
        return { ...tab, sections: filteredSections };
      }
      return null;
    }).filter(Boolean) as Tab[];

    return { ...pageData, tabs: filteredTabs };
  }, [pageData, searchTerm]);

  return (
    <DndProvider backend={HTML5Backend}>
    <div className="admin-page">
      <div className="admin-header">
        <h1><Settings size={24} /> Content Management System</h1>
        <div className="admin-actions">
          <label className="btn btn-secondary">
            <Upload size={18} /> Import
            <input
              type="file"
              accept=".json"
              style={{ display: 'none' }}
              onChange={handleImport}
            />
          </label>
          <button className="btn btn-secondary" onClick={handleExport}>
            <Download size={18} /> Export
          </button>
          <button className="btn btn-danger" onClick={handleLogout}>
            <LogOut size={18} /> Logout
          </button>
        </div>
      </div>

      <div className="admin-panel-v2">
        {/* Top section with sidebar and editor */}
        <div className="admin-top-section">
          {/* Sidebar */}
          <div className="admin-sidebar">
          {/* Page Selector */}
          <div className="admin-search">
            <div className="page-buttons" style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
              <button
                className={`page-btn ${selectedPage === 'landing' ? 'active' : ''}`}
                onClick={() => { setSelectedPage('landing'); setSelectedItem(null); setEditingData(null); }}
                style={{
                  flex: '1 1 100%',
                  padding: '8px 12px',
                  background: selectedPage === 'landing' ? 'var(--brand-gradient)' : 'var(--bg-primary)',
                  color: selectedPage === 'landing' ? 'white' : 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                  marginBottom: '4px'
                }}
              >
                Landing Page
              </button>
              <button
                className={`page-btn ${selectedPage === 'caregiver' ? 'active' : ''}`}
                onClick={() => setSelectedPage('caregiver')}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  background: selectedPage === 'caregiver' ? 'var(--brand-gradient)' : 'var(--bg-primary)',
                  color: selectedPage === 'caregiver' ? 'white' : 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)'
                }}
              >
                Caregiver
              </button>
              <button
                className={`page-btn ${selectedPage === 'carerecipient' ? 'active' : ''}`}
                onClick={() => setSelectedPage('carerecipient')}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  background: selectedPage === 'carerecipient' ? 'var(--brand-gradient)' : 'var(--bg-primary)',
                  color: selectedPage === 'carerecipient' ? 'white' : 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)'
                }}
              >
                Care Recipient
              </button>
            </div>

            {/* Search */}
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input
                type="text"
                placeholder="Search content..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '40px' }}
              />
            </div>
          </div>

          {/* Content Tree */}
          <div className="admin-tree">
            {selectedPage === 'landing' ? (
              <div style={{ padding: 'var(--spacing-lg)', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <h3 style={{ margin: '0 0 var(--spacing-md) 0' }}>Landing Page</h3>
                <p>Edit the landing page content in the editor on the right.</p>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
                  <h3 style={{ margin: 0 }}>Content Structure</h3>
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={handleNewTab}
                    style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px' }}
                  >
                    <Plus size={14} /> New Tab
                  </button>
                </div>
                <p className="drag-hint">Drag items by the handle to reorder</p>

                {filteredContent?.tabs.map((tab, tabIndex) => (
              <DraggableTreeItem
                key={tab.id}
                item={tab}
                itemType="tab"
                index={tabIndex}
                onMove={(dragIndex, hoverIndex) => reorderTabs(selectedPage, dragIndex, hoverIndex)}
                className="tree-item"
              >
                <div
                  className={`tree-item-content ${selectedItem?.type === 'tab' && selectedItem?.data.id === tab.id ? 'selected' : ''}`}
                  onClick={() => {
                    handleItemSelect({ type: 'tab', data: tab });
                    toggleTabExpansion(tab.id);
                  }}
                >
                  <div className="drag-handle"><GripVertical size={14} /></div>
                  <div className="tree-item-icon">
                    {expandedTabs.has(tab.id) ? <FolderOpen size={16} /> : <Folder size={16} />}
                  </div>
                  <div className="tree-item-text">{tab.title}</div>
                  <div className="tree-item-badge">{tab.sections.length}</div>
                </div>

                {expandedTabs.has(tab.id) && (
                  <div className="tree-children">
                    {tab.sections.map((section, sectionIndex) => (
                      <DraggableTreeItem
                        key={section.id}
                        item={section}
                        itemType="section"
                        index={sectionIndex}
                        parentId={tab.id}
                        onMove={(dragIndex, hoverIndex) => reorderSections(selectedPage, tab.id, dragIndex, hoverIndex)}
                        className="tree-item tree-section-item"
                      >
                        <div
                          className={`tree-item-content ${selectedItem?.type === 'section' && selectedItem?.data.id === section.id ? 'selected' : ''}`}
                          onClick={() => handleItemSelect({ type: 'section', data: section, tabId: tab.id })}
                        >
                          <div className="drag-handle"><GripVertical size={12} /></div>
                          <div className="tree-item-icon">
                            <Folder size={14} />
                          </div>
                          <div className="tree-item-text">{section.title}</div>
                          <div className="tree-item-badge">{section.items.length}</div>
                        </div>

                        <div className="tree-children">
                          {section.items.map((item, itemIndex) => (
                            <DraggableTreeItem
                              key={item.id}
                              item={item}
                              itemType="item"
                              index={itemIndex}
                              parentId={section.id}
                              onMove={(dragIndex, hoverIndex) => reorderContentItems(selectedPage, tab.id, section.id, dragIndex, hoverIndex)}
                              className="tree-item tree-content-item"
                            >
                              <div
                                className={`tree-item-content ${selectedItem?.type === 'item' && selectedItem?.data.id === item.id ? 'selected' : ''}`}
                                onClick={() => handleItemSelect({ type: 'item', data: item, tabId: tab.id, sectionId: section.id })}
                              >
                                <div className="drag-handle"><GripVertical size={10} /></div>
                                <div className="tree-item-icon">
                                  <FileText size={12} />
                                </div>
                                <div className="tree-item-text">{item.title}</div>
                              </div>
                            </DraggableTreeItem>
                          ))}
                          {/* New Item button */}
                          <button
                            className="tree-add-btn"
                            onClick={(e) => { e.stopPropagation(); handleNewItem(tab.id, section.id); }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '4px 8px',
                              marginTop: '4px',
                              marginLeft: '24px',
                              fontSize: '0.75rem',
                              background: 'transparent',
                              border: '1px dashed var(--border-color)',
                              borderRadius: 'var(--radius-sm)',
                              color: 'var(--text-muted)',
                              cursor: 'pointer'
                            }}
                          >
                            <Plus size={10} /> Add Item
                          </button>
                        </div>
                      </DraggableTreeItem>
                    ))}
                    {/* New Section button */}
                    <button
                      className="tree-add-btn"
                      onClick={(e) => { e.stopPropagation(); handleNewSection(tab.id); }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '6px 10px',
                        marginTop: '8px',
                        marginLeft: '16px',
                        fontSize: '0.8rem',
                        background: 'transparent',
                        border: '1px dashed var(--border-color)',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--text-muted)',
                        cursor: 'pointer'
                      }}
                    >
                      <Plus size={12} /> Add Section
                    </button>
                  </div>
                )}
              </DraggableTreeItem>
                ))}
              </>
            )}
          </div>
          </div>

          {/* Main Content Editor */}
          <div className="admin-editor">
          {selectedPage === 'landing' ? (
            <div className="editor-container">
              <div className="editor-header">
                <h2>
                  <Edit3 size={20} style={{ marginRight: '8px' }} />
                  Landing Page
                </h2>
              </div>
              <div className="editor-body">
                {landingPageData && (
                  <LandingPageEditor
                    data={landingPageData}
                    onChange={(updates) => {
                      setLandingPageData(updates);
                      updateLandingPage(updates);
                    }}
                  />
                )}
              </div>
            </div>
          ) : selectedItem ? (
            <div className="editor-container">
              <div className="editor-header">
                <h2>
                  <Edit3 size={20} style={{ marginRight: '8px' }} />
                  {selectedItem.type === 'tab' && 'Tab: '}
                  {selectedItem.type === 'section' && 'Section: '}
                  {selectedItem.type === 'item' && 'Content: '}
                  {selectedItem.data.title}
                </h2>
                <SaveStatus status={saveStatus || 'saved'} />
              </div>

              <div className="editor-body">
                {selectedItem.type === 'tab' && (
                  <TabEditor
                    tab={editingData}
                    onChange={setEditingData}
                    onDelete={handleDelete}
                  />
                )}

                {selectedItem.type === 'section' && (
                  <SectionEditor
                    section={editingData}
                    onChange={setEditingData}
                    onDelete={handleDelete}
                  />
                )}

                {selectedItem.type === 'item' && (
                  <ContentItemEditor
                    item={editingData}
                    onChange={setEditingData}
                    onDelete={handleDelete}
                  />
                )}
              </div>
            </div>
            ) : (
              <EmptyState message="Select an item to edit" />
            )}
          </div>
        </div>

        {/* Save status toast */}
        {(() => {
          let toastType = 'idle';
          let toastContent = '';

          if (isLoadingItem) {
            toastType = 'loading';
            toastContent = '⟳ Loading...';
          } else if (saveStatus === 'saving') {
            toastType = 'saving';
            toastContent = '⟳ Saving...';
          } else if (saveStatus === 'error') {
            toastType = 'error';
            toastContent = '⚠ Save Failed';
          } else if (hasChanges) {
            toastType = 'unsaved';
            toastContent = '● Unsaved changes';
          } else if (saveStatus === 'saved') {
            toastType = 'saved';
            toastContent = '✓ Saved';
          }

          return (
            <div className={`save-status-bar toast-${toastType}`}>
              <div className="save-status">
                {toastContent}
              </div>
            </div>
          );
        })()}
      </div>

      <style>{`
        .admin-page {
          max-width: 100%;
          height: 100vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .admin-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--spacing-lg);
          background: var(--bg-secondary);
          border-radius: var(--radius-lg);
          margin-bottom: var(--spacing-lg);
        }

        .admin-header h1 {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
          margin: 0;
        }

        .admin-actions {
          display: flex;
          gap: var(--spacing-md);
        }

        .preview-section {
          border-top: 1px solid var(--border-color);
          background: var(--bg-secondary);
          display: flex;
          flex-direction: column;
        }

        .preview-toggle {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          width: 100%;
          padding: var(--spacing-sm) var(--spacing-lg);
          background: var(--bg-tertiary);
          border: none;
          cursor: pointer;
          font-weight: 600;
          font-size: 0.875rem;
          color: var(--text-primary);
          transition: background var(--transition-fast);
        }

        .preview-toggle:hover {
          background: var(--bg-secondary);
        }

        .preview-panel {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 300px;
          max-height: 50vh;
        }

        .preview-header {
          padding: var(--spacing-sm) var(--spacing-lg);
          background: var(--bg-tertiary);
          border-bottom: 1px solid var(--border-color);
        }

        .preview-header h3 {
          margin: 0;
          font-size: 0.875rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          color: var(--text-secondary);
        }

        .preview-container {
          flex: 1;
          position: relative;
          overflow: hidden;
        }

        .preview-frame {
          width: 100%;
          height: 100%;
        }

        .preview-iframe {
          width: 100%;
          height: 100%;
          border: none;
          background: white;
        }

        .preview-loading {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: var(--bg-secondary);
        }

        .drag-hint {
          font-size: 0.75rem;
          color: var(--text-muted);
          font-style: italic;
          margin: 0 0 var(--spacing-sm) 0;
          padding: 0 var(--spacing-sm);
        }

        .drag-handle {
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: grab;
          color: var(--text-muted);
          padding: 2px;
          margin-right: var(--spacing-xs);
          border-radius: var(--radius-sm);
          transition: all var(--transition-fast);
        }

        .drag-handle:hover {
          color: var(--text-primary);
          background: var(--bg-tertiary);
        }

        .drag-handle:active {
          cursor: grabbing;
        }

        .sortable-item {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .sortable-item.dragging {
          opacity: 0.5;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .sortable-item.drag-over {
          border-top: 2px solid var(--brand-primary);
        }
      `}</style>
    </div>
    </DndProvider>
  );
}

// Save Status Component
function SaveStatus({ status }: { status: any }) {
  return (
    <div className={`save-status ${status}`}>
      {status === 'saving' && (
        <>
          <Loader size={14} className="save-status-icon" />
          <span>Saving...</span>
        </>
      )}
      {status === 'saved' && (
        <>
          <Check size={14} className="save-status-icon" />
          <span>Saved</span>
        </>
      )}
      {status === 'error' && (
        <>
          <AlertCircle size={14} className="save-status-icon" />
          <span>Error</span>
        </>
      )}
      {status === 'idle' && <span></span>}
    </div>
  );
}

// Empty State Component
function EmptyState({ message }: { message: string }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        <FileText size={48} />
      </div>
      <h3>No Item Selected</h3>
      <p>{message}</p>
    </div>
  );
}

// Tab Editor Component
function TabEditor({ tab, onChange, onDelete }: { tab: Tab; onChange: (tab: Tab) => void; onDelete: () => void }) {
  return (
    <div className="editor-form">
      <div className="form-group">
        <label className="form-label">Tab Title</label>
        <input
          type="text"
          className="form-control"
          value={tab.title}
          onChange={(e) => onChange({ ...tab, title: e.target.value })}
          placeholder="Enter tab title..."
        />
      </div>

      <div className="form-checkbox">
        <input
          type="checkbox"
          id="tab-visible"
          checked={tab.visible}
          onChange={(e) => onChange({ ...tab, visible: e.target.checked })}
        />
        <label htmlFor="tab-visible" className="form-label">Published</label>
      </div>

      <p className="form-hint"><em>Drag items using the grip handle on the left to reorder.</em></p>

      <div style={{ marginTop: 'var(--spacing-xl)', paddingTop: 'var(--spacing-lg)', borderTop: '1px solid var(--border-color)' }}>
        <button
          className="btn btn-danger"
          onClick={onDelete}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Trash2 size={16} /> Delete Tab
        </button>
      </div>
    </div>
  );
}

// Section Editor Component
function SectionEditor({ section, onChange, onDelete }: { section: Section; onChange: (section: Section) => void; onDelete: () => void }) {
  return (
    <div className="editor-form">
      <div className="form-group">
        <label className="form-label">Section Title</label>
        <input
          type="text"
          className="form-control"
          value={section.title}
          onChange={(e) => onChange({ ...section, title: e.target.value })}
          placeholder="Enter section title..."
        />
      </div>

      <div className="form-checkbox">
        <input
          type="checkbox"
          id="section-visible"
          checked={section.visible ?? true}
          onChange={(e) => onChange({ ...section, visible: e.target.checked })}
        />
        <label htmlFor="section-visible" className="form-label">Published</label>
      </div>

      <p className="form-hint"><em>Drag items using the grip handle on the left to reorder.</em></p>

      <div style={{ marginTop: 'var(--spacing-xl)', paddingTop: 'var(--spacing-lg)', borderTop: '1px solid var(--border-color)' }}>
        <button
          className="btn btn-danger"
          onClick={onDelete}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Trash2 size={16} /> Delete Section
        </button>
      </div>
    </div>
  );
}

// Content Item Editor Component
function ContentItemEditor({ item, onChange, onDelete }: { item: ContentItem; onChange: (item: ContentItem) => void; onDelete: () => void }) {
  return (
    <div className="editor-form">
      <div className="form-group">
        <label className="form-label">Content Title</label>
        <input
          type="text"
          className="form-control"
          value={item.title}
          onChange={(e) => onChange({ ...item, title: e.target.value })}
          placeholder="Enter content title..."
        />
      </div>

      <div className="form-group">
        <label className="form-label">Content</label>
        <Editor
          apiKey={import.meta.env.VITE_TINYMCE_API_KEY}
          value={item.content}
          onEditorChange={(content) => onChange({ ...item, content: content || '' })}
          init={{
            height: 300,
            menubar: false,
            plugins: [
              'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
              'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
              'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
            ],
            toolbar: 'undo redo | blocks | ' +
              'bold italic forecolor | alignleft aligncenter ' +
              'alignright alignjustify | bullist numlist outdent indent | ' +
              'styleselect | removeformat | help',
            formats: {
              lineheight1: { selector: 'p,h1,h2,h3,h4,h5,h6,div', styles: { lineHeight: '1' }},
              lineheight15: { selector: 'p,h1,h2,h3,h4,h5,h6,div', styles: { lineHeight: '1.5' }},
              lineheight2: { selector: 'p,h1,h2,h3,h4,h5,h6,div', styles: { lineHeight: '2' }}
            },
            style_formats: [
              { title: 'Line Height 1.0', format: 'lineheight1' },
              { title: 'Line Height 1.5', format: 'lineheight15' },
              { title: 'Line Height 2.0', format: 'lineheight2' }
            ],
            content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }'
          }}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Sources (URLs only, one per line)</label>
        <textarea
          className="form-control"
          value={item.sources || ''}
          onChange={(e) => onChange({ ...item, sources: e.target.value })}
          placeholder="https://example.com&#10;https://another-source.org"
          rows={3}
        />
        <small className="form-help">Enter URLs only. They will automatically become clickable links.</small>
      </div>

      <div className="form-checkbox">
        <input
          type="checkbox"
          id="item-visible"
          checked={item.visible ?? true}
          onChange={(e) => onChange({ ...item, visible: e.target.checked })}
        />
        <label htmlFor="item-visible" className="form-label">Published</label>
      </div>

      <p className="form-hint"><em>Drag items using the grip handle on the left to reorder.</em></p>

      <div style={{ marginTop: 'var(--spacing-xl)', paddingTop: 'var(--spacing-lg)', borderTop: '1px solid var(--border-color)' }}>
        <button
          className="btn btn-danger"
          onClick={onDelete}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Trash2 size={16} /> Delete Content Item
        </button>
      </div>
    </div>
  );
}

// Landing Page Editor Component
function LandingPageEditor({ data, onChange }: { data: LandingPageConfig; onChange: (data: LandingPageConfig) => void }) {
  return (
    <div className="editor-form">
      <h3 style={{ marginBottom: 'var(--spacing-lg)', color: 'var(--text-primary)' }}>Hero Section</h3>

      <div className="form-group">
        <label className="form-label">Hero Title</label>
        <input
          type="text"
          className="form-control"
          value={data.heroTitle}
          onChange={(e) => onChange({ ...data, heroTitle: e.target.value })}
          placeholder="Welcome to RAGE4INFO"
        />
      </div>

      <div className="form-group">
        <label className="form-label">Hero Subtitle</label>
        <textarea
          className="form-control"
          value={data.heroSubtitle}
          onChange={(e) => onChange({ ...data, heroSubtitle: e.target.value })}
          placeholder="Your comprehensive resource for caregiving information and support"
          rows={2}
        />
      </div>

      <hr style={{ margin: 'var(--spacing-xl) 0', borderColor: 'var(--border-color)' }} />

      <h3 style={{ marginBottom: 'var(--spacing-lg)', color: 'var(--text-primary)' }}>Caregiver Card</h3>

      <div className="form-group">
        <label className="form-label">Card Title</label>
        <input
          type="text"
          className="form-control"
          value={data.caregiverCard.title}
          onChange={(e) => onChange({
            ...data,
            caregiverCard: { ...data.caregiverCard, title: e.target.value }
          })}
          placeholder="INFO4 Caregivers"
        />
      </div>

      <div className="form-group">
        <label className="form-label">Card Description</label>
        <textarea
          className="form-control"
          value={data.caregiverCard.description}
          onChange={(e) => onChange({
            ...data,
            caregiverCard: { ...data.caregiverCard, description: e.target.value }
          })}
          placeholder="Access resources, training materials..."
          rows={3}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Button Text</label>
        <input
          type="text"
          className="form-control"
          value={data.caregiverCard.buttonText}
          onChange={(e) => onChange({
            ...data,
            caregiverCard: { ...data.caregiverCard, buttonText: e.target.value }
          })}
          placeholder="Explore Caregiver Resources"
        />
      </div>

      <hr style={{ margin: 'var(--spacing-xl) 0', borderColor: 'var(--border-color)' }} />

      <h3 style={{ marginBottom: 'var(--spacing-lg)', color: 'var(--text-primary)' }}>Care Recipient Card</h3>

      <div className="form-group">
        <label className="form-label">Card Title</label>
        <input
          type="text"
          className="form-control"
          value={data.careRecipientCard.title}
          onChange={(e) => onChange({
            ...data,
            careRecipientCard: { ...data.careRecipientCard, title: e.target.value }
          })}
          placeholder="INFO4 People with Disabilities"
        />
      </div>

      <div className="form-group">
        <label className="form-label">Card Description</label>
        <textarea
          className="form-control"
          value={data.careRecipientCard.description}
          onChange={(e) => onChange({
            ...data,
            careRecipientCard: { ...data.careRecipientCard, description: e.target.value }
          })}
          placeholder="Find information about care options..."
          rows={3}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Button Text</label>
        <input
          type="text"
          className="form-control"
          value={data.careRecipientCard.buttonText}
          onChange={(e) => onChange({
            ...data,
            careRecipientCard: { ...data.careRecipientCard, buttonText: e.target.value }
          })}
          placeholder="Explore Care Recipient Resources"
        />
      </div>

      <p className="form-hint"><em>Changes are saved automatically.</em></p>
    </div>
  );
}