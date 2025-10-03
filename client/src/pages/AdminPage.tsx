import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Settings, Plus, Edit2, Trash2, Save, X, Move,
  FileText, Folder, ChevronRight, LogOut, Download, Upload
} from 'lucide-react';
import { useContentStore } from '../store/contentStore';
import { Editor } from '@tinymce/tinymce-react';
import { Tab, Section, ContentItem } from '../../../shared/types';
import clsx from 'clsx';

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
    deleteContentItem
  } = useContentStore();

  const [selectedPage, setSelectedPage] = useState('caregiver');
  const [selectedTab, setSelectedTab] = useState<Tab | null>(null);
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editMode, setEditMode] = useState<'tab' | 'section' | 'item' | null>(null);

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

  const pageData = content.pages[selectedPage];
  if (!pageData) return <div>Page not found</div>;

  return (
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

      <div className="admin-layout">
        {/* Sidebar */}
        <div className="admin-sidebar">
          <div className="page-selector">
            <h3>Pages</h3>
            <div className="page-buttons">
              <button
                className={clsx('page-btn', { active: selectedPage === 'caregiver' })}
                onClick={() => setSelectedPage('caregiver')}
              >
                Caregiver
              </button>
              <button
                className={clsx('page-btn', { active: selectedPage === 'carerecipient' })}
                onClick={() => setSelectedPage('carerecipient')}
              >
                Care Recipient
              </button>
            </div>
          </div>

          <div className="content-tree">
            <h3>Content Structure</h3>
            <button
              className="btn btn-success btn-sm"
              onClick={() => {
                setEditMode('tab');
                setEditingItem({
                  id: `tab-${Date.now()}`,
                  title: 'New Tab',
                  sections: [],
                  order: pageData.tabs.length,
                  visible: true
                });
              }}
            >
              <Plus size={16} /> Add Tab
            </button>

            <div className="tree-list">
              {pageData.tabs.map(tab => (
                <div key={tab.id} className="tree-item">
                  <div
                    className={clsx('tree-tab', { selected: selectedTab?.id === tab.id })}
                    onClick={() => setSelectedTab(tab)}
                  >
                    <Folder size={16} />
                    <span>{tab.title}</span>
                    <div className="tree-actions">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditMode('tab');
                          setEditingItem(tab);
                        }}
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('Delete this tab?')) {
                            deleteTab(selectedPage, tab.id);
                          }
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {selectedTab?.id === tab.id && (
                    <div className="tree-sections">
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => {
                          setEditMode('section');
                          setEditingItem({
                            id: `section-${Date.now()}`,
                            title: 'New Section',
                            items: [],
                            order: tab.sections.length,
                            collapsible: true
                          });
                        }}
                      >
                        <Plus size={14} /> Add Section
                      </button>

                      {tab.sections.map(section => (
                        <div key={section.id} className="tree-item">
                          <div
                            className={clsx('tree-section', { selected: selectedSection?.id === section.id })}
                            onClick={() => setSelectedSection(section)}
                          >
                            <ChevronRight size={14} />
                            <span>{section.title}</span>
                            <div className="tree-actions">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditMode('section');
                                  setEditingItem(section);
                                }}
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (confirm('Delete this section?')) {
                                    deleteSection(selectedPage, tab.id, section.id);
                                  }
                                }}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>

                          {selectedSection?.id === section.id && (
                            <div className="tree-items">
                              <button
                                className="btn btn-success btn-sm"
                                onClick={() => {
                                  setEditMode('item');
                                  setEditingItem({
                                    id: `item-${Date.now()}`,
                                    title: 'New Content',
                                    content: '',
                                    sources: '',
                                    lastUpdated: new Date().toISOString(),
                                    order: section.items.length
                                  });
                                }}
                              >
                                <Plus size={12} /> Add Content
                              </button>

                              {section.items.map(item => (
                                <div key={item.id} className="tree-content-item">
                                  <FileText size={12} />
                                  <span>{item.title}</span>
                                  <div className="tree-actions">
                                    <button
                                      onClick={() => {
                                        setEditMode('item');
                                        setEditingItem(item);
                                      }}
                                    >
                                      <Edit2 size={12} />
                                    </button>
                                    <button
                                      onClick={() => {
                                        if (confirm('Delete this content?')) {
                                          deleteContentItem(selectedPage, tab.id, section.id, item.id);
                                        }
                                      }}
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content Editor */}
        <div className="admin-main">
          {editMode && editingItem && (
            <div className="editor-panel">
              <div className="editor-header">
                <h2>
                  {editMode === 'tab' && 'Edit Tab'}
                  {editMode === 'section' && 'Edit Section'}
                  {editMode === 'item' && 'Edit Content Item'}
                </h2>
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setEditMode(null);
                    setEditingItem(null);
                  }}
                >
                  <X size={18} /> Cancel
                </button>
              </div>

              <div className="editor-body">
                {editMode === 'tab' && (
                  <TabEditor
                    tab={editingItem}
                    onSave={(tab) => {
                      if (pageData.tabs.find(t => t.id === tab.id)) {
                        updateTab(selectedPage, tab.id, tab);
                      } else {
                        addTab(selectedPage, tab);
                      }
                      setEditMode(null);
                      setEditingItem(null);
                    }}
                  />
                )}

                {editMode === 'section' && selectedTab && (
                  <SectionEditor
                    section={editingItem}
                    onSave={(section) => {
                      if (selectedTab.sections.find(s => s.id === section.id)) {
                        updateSection(selectedPage, selectedTab.id, section.id, section);
                      } else {
                        addSection(selectedPage, selectedTab.id, section);
                      }
                      setEditMode(null);
                      setEditingItem(null);
                    }}
                  />
                )}

                {editMode === 'item' && selectedTab && selectedSection && (
                  <ContentItemEditor
                    item={editingItem}
                    onSave={(item) => {
                      if (selectedSection.items.find(i => i.id === item.id)) {
                        updateContentItem(selectedPage, selectedTab.id, selectedSection.id, item.id, item);
                      } else {
                        addContentItem(selectedPage, selectedTab.id, selectedSection.id, item);
                      }
                      setEditMode(null);
                      setEditingItem(null);
                    }}
                  />
                )}
              </div>
            </div>
          )}

          {!editMode && (
            <div className="welcome-panel">
              <h2>Welcome to the Admin Panel</h2>
              <p>Select a tab, section, or content item from the sidebar to edit.</p>
              <p>You can add, edit, delete, and reorder any content element.</p>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .admin-page {
          max-width: 100%;
          height: calc(100vh - 200px);
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

        .admin-layout {
          display: grid;
          grid-template-columns: 350px 1fr;
          gap: var(--spacing-lg);
          height: 100%;
        }

        .admin-sidebar {
          background: var(--bg-secondary);
          border-radius: var(--radius-lg);
          padding: var(--spacing-lg);
          overflow-y: auto;
        }

        .page-selector {
          margin-bottom: var(--spacing-xl);
        }

        .page-selector h3 {
          margin-bottom: var(--spacing-md);
        }

        .page-buttons {
          display: flex;
          gap: var(--spacing-sm);
        }

        .page-btn {
          flex: 1;
          padding: var(--spacing-sm);
          background: var(--bg-primary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .page-btn.active {
          background: var(--brand-gradient);
          color: white;
          border-color: var(--brand-primary);
        }

        .content-tree h3 {
          margin-bottom: var(--spacing-md);
        }

        .tree-list {
          margin-top: var(--spacing-md);
        }

        .tree-item {
          margin-bottom: var(--spacing-sm);
        }

        .tree-tab, .tree-section, .tree-content-item {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          padding: var(--spacing-sm);
          background: var(--bg-primary);
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: all var(--transition-fast);
          position: relative;
        }

        .tree-tab:hover, .tree-section:hover, .tree-content-item:hover {
          background: var(--bg-tertiary);
        }

        .tree-tab.selected, .tree-section.selected {
          background: var(--brand-gradient);
          color: white;
        }

        .tree-actions {
          display: none;
          gap: var(--spacing-xs);
          margin-left: auto;
        }

        .tree-tab:hover .tree-actions,
        .tree-section:hover .tree-actions,
        .tree-content-item:hover .tree-actions {
          display: flex;
        }

        .tree-actions button {
          background: none;
          border: none;
          cursor: pointer;
          padding: var(--spacing-xs);
          border-radius: var(--radius-sm);
          transition: background var(--transition-fast);
        }

        .tree-actions button:hover {
          background: rgba(0, 0, 0, 0.1);
        }

        .tree-sections {
          padding-left: var(--spacing-lg);
          margin-top: var(--spacing-sm);
        }

        .tree-items {
          padding-left: var(--spacing-lg);
          margin-top: var(--spacing-sm);
        }

        .tree-content-item {
          font-size: 0.9rem;
        }

        .admin-main {
          background: var(--bg-secondary);
          border-radius: var(--radius-lg);
          padding: var(--spacing-lg);
          overflow-y: auto;
        }

        .editor-panel {
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .editor-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: var(--spacing-lg);
          border-bottom: 1px solid var(--border-color);
          margin-bottom: var(--spacing-lg);
        }

        .editor-body {
          flex: 1;
          overflow-y: auto;
        }

        .welcome-panel {
          text-align: center;
          padding: var(--spacing-2xl);
        }

        .welcome-panel h2 {
          margin-bottom: var(--spacing-md);
        }

        .welcome-panel p {
          color: var(--text-secondary);
          margin-bottom: var(--spacing-sm);
        }
      `}</style>
    </div>
  );
}

// Tab Editor Component
function TabEditor({ tab, onSave }: { tab: Tab; onSave: (tab: Tab) => void }) {
  const [title, setTitle] = useState(tab.title);
  const [visible, setVisible] = useState(tab.visible);
  const [order, setOrder] = useState(tab.order);

  return (
    <div className="editor-form">
      <div className="form-group">
        <label className="form-label">Tab Title</label>
        <input
          type="text"
          className="form-control"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div className="form-group">
        <label className="form-label">
          <input
            type="checkbox"
            checked={visible}
            onChange={(e) => setVisible(e.target.checked)}
          />
          {' '}Visible
        </label>
      </div>

      <div className="form-group">
        <label className="form-label">Order</label>
        <input
          type="number"
          className="form-control"
          value={order}
          onChange={(e) => setOrder(Number(e.target.value))}
        />
      </div>

      <button
        className="btn btn-primary"
        onClick={() => onSave({ ...tab, title, visible, order })}
      >
        <Save size={18} /> Save Tab
      </button>
    </div>
  );
}

// Section Editor Component
function SectionEditor({ section, onSave }: { section: Section; onSave: (section: Section) => void }) {
  const [title, setTitle] = useState(section.title);
  const [collapsible, setCollapsible] = useState(section.collapsible);
  const [order, setOrder] = useState(section.order);

  return (
    <div className="editor-form">
      <div className="form-group">
        <label className="form-label">Section Title</label>
        <input
          type="text"
          className="form-control"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div className="form-group">
        <label className="form-label">
          <input
            type="checkbox"
            checked={collapsible}
            onChange={(e) => setCollapsible(e.target.checked)}
          />
          {' '}Collapsible
        </label>
      </div>

      <div className="form-group">
        <label className="form-label">Order</label>
        <input
          type="number"
          className="form-control"
          value={order}
          onChange={(e) => setOrder(Number(e.target.value))}
        />
      </div>

      <button
        className="btn btn-primary"
        onClick={() => onSave({ ...section, title, collapsible, order })}
      >
        <Save size={18} /> Save Section
      </button>
    </div>
  );
}

// Content Item Editor Component
function ContentItemEditor({ item, onSave }: { item: ContentItem; onSave: (item: ContentItem) => void }) {
  const [title, setTitle] = useState(item.title);
  const [content, setContent] = useState(item.content);
  const [sources, setSources] = useState(item.sources || '');
  const [order, setOrder] = useState(item.order);

  return (
    <div className="editor-form">
      <div className="form-group">
        <label className="form-label">Content Title</label>
        <input
          type="text"
          className="form-control"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Content</label>
        <Editor
          apiKey="n0f2s874rmn85hrrfw88rvv34rjelbp19avlarqf2u41m8u4"
          value={content}
          onEditorChange={setContent}
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
              'removeformat | help',
            content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }'
          }}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Sources</label>
        <Editor
          apiKey="n0f2s874rmn85hrrfw88rvv34rjelbp19avlarqf2u41m8u4"
          value={sources}
          onEditorChange={setSources}
          init={{
            height: 150,
            menubar: false,
            plugins: ['link', 'lists'],
            toolbar: 'undo redo | bold italic | link | bullist numlist',
            content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:12px }'
          }}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Order</label>
        <input
          type="number"
          className="form-control"
          value={order}
          onChange={(e) => setOrder(Number(e.target.value))}
        />
      </div>

      <button
        className="btn btn-primary"
        onClick={() => onSave({
          ...item,
          title,
          content,
          sources,
          order,
          lastUpdated: new Date().toISOString()
        })}
      >
        <Save size={18} /> Save Content
      </button>

      <style jsx>{`
        .editor-form {
          max-width: 800px;
        }
      `}</style>
    </div>
  );
}