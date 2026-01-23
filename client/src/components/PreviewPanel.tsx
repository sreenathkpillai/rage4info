import { useState, useEffect, useRef } from 'react';
import { Eye } from 'lucide-react';
import type { Page } from '../../../shared/types';

interface PreviewPanelProps {
  pageData: Page;
  selectedPage: string;
}

export default function PreviewPanel({ pageData, selectedPage }: PreviewPanelProps) {
  const [isLoading, setIsLoading] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (pageData) {
      setIsLoading(true);
      // Store preview content in sessionStorage
      const previewContent = {
        pageData,
        selectedPage,
        timestamp: Date.now()
      };
      sessionStorage.setItem('preview-content', JSON.stringify(previewContent));

      // Clear loading after a short delay to ensure content is ready
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [pageData, selectedPage]);



  // Helper function to convert URLs to clickable links
  const convertUrlsToLinks = (sources: string) => {
    if (!sources) return '';

    const lines = sources.split('\n');
    const linkifiedLines = lines.map(line => {
      const trimmed = line.trim();
      if (trimmed && (trimmed.startsWith('http://') || trimmed.startsWith('https://'))) {
        return `<a href="${trimmed}" target="_blank" rel="noopener noreferrer" style="cursor: pointer; color: var(--brand-primary); text-decoration: underline;">${trimmed}</a>`;
      }
      return trimmed;
    }).filter(line => line); // Remove empty lines

    return linkifiedLines.join('<br>');
  };

  // Generate preview HTML
  const generatePreviewHTML = () => {
    const visibleTabs = pageData.tabs.filter(tab => tab.visible);
    const firstTab = visibleTabs[0];

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Preview - ${pageData.title}</title>
    <style>
        :root {
            --brand-primary: #2563eb;
            --brand-secondary: #7c3aed;
            --brand-gradient: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
            --text-primary: #1f2937;
            --text-secondary: #6b7280;
            --bg-primary: #ffffff;
            --bg-secondary: #f9fafb;
            --bg-tertiary: #f3f4f6;
            --border-color: #e5e7eb;
            --success-color: #10b981;
            --warning-color: #f59e0b;
            --error-color: #ef4444;
            --spacing-xs: 0.25rem;
            --spacing-sm: 0.5rem;
            --spacing-md: 1rem;
            --spacing-lg: 1.5rem;
            --spacing-xl: 2rem;
            --spacing-2xl: 3rem;
            --radius-sm: 0.25rem;
            --radius-md: 0.5rem;
            --radius-lg: 1rem;
            --transition-fast: 0.15s ease;
            --transition-normal: 0.25s ease;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
            background: var(--bg-primary);
            color: var(--text-primary);
            line-height: 1.6;
        }

        .preview-container {
            max-width: 1200px;
            margin: 0 auto;
            padding: var(--spacing-lg);
            min-height: 100vh;
        }

        .page-header {
            text-align: center;
            margin-bottom: var(--spacing-2xl);
            padding: var(--spacing-xl) 0;
            background: var(--brand-gradient);
            color: white;
            border-radius: var(--radius-lg);
        }

        .page-title {
            font-size: 2.5rem;
            font-weight: 700;
            margin-bottom: var(--spacing-md);
        }

        .page-description {
            font-size: 1.1rem;
            opacity: 0.9;
            max-width: 600px;
            margin: 0 auto;
        }

        .tabs-container {
            margin-bottom: var(--spacing-xl);
        }

        .tab-navigation {
            display: flex;
            gap: var(--spacing-sm);
            margin-bottom: var(--spacing-lg);
            border-bottom: 2px solid var(--border-color);
            overflow-x: auto;
        }

        .tab-button {
            padding: var(--spacing-md) var(--spacing-lg);
            background: none;
            border: none;
            cursor: pointer;
            font-size: 1rem;
            font-weight: 600;
            color: var(--text-secondary);
            border-bottom: 3px solid transparent;
            transition: all var(--transition-normal);
            white-space: nowrap;
        }

        .tab-button.active {
            color: var(--brand-primary);
            border-bottom-color: var(--brand-primary);
        }

        .tab-button:hover {
            color: var(--brand-primary);
        }

        .tab-content {
            display: none;
        }

        .tab-content.active {
            display: block;
        }

        .section {
            background: var(--bg-secondary);
            border-radius: var(--radius-lg);
            margin-bottom: var(--spacing-lg);
            overflow: hidden;
            border: 1px solid var(--border-color);
        }

        .section-header {
            background: var(--bg-tertiary);
            padding: var(--spacing-lg);
            cursor: pointer;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid var(--border-color);
        }

        .section-title {
            font-size: 1.25rem;
            font-weight: 600;
            margin: 0;
        }

        .section-content {
            padding: var(--spacing-lg);
        }

        .content-item {
            background: var(--bg-primary);
            border-radius: var(--radius-md);
            padding: var(--spacing-lg);
            margin-bottom: var(--spacing-md);
            border: 1px solid var(--border-color);
        }

        .content-item:last-child {
            margin-bottom: 0;
        }

        .content-item h3 {
            font-size: 1.1rem;
            font-weight: 600;
            margin-bottom: var(--spacing-md);
            color: var(--brand-primary);
        }

        .content-item-content {
            margin-bottom: var(--spacing-md);
        }

        .content-item-content p {
            margin-bottom: var(--spacing-sm);
        }

        .content-item-content ul,
        .content-item-content ol {
            padding-left: var(--spacing-lg);
            margin-bottom: var(--spacing-sm);
        }

        .content-sources {
            font-size: 0.9rem;
            color: var(--text-secondary);
            border-top: 1px solid var(--border-color);
            padding-top: var(--spacing-md);
        }

        .content-sources h4 {
            margin-bottom: var(--spacing-sm);
        }

        .preview-watermark {
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(37, 99, 235, 0.9);
            color: white;
            padding: var(--spacing-xs) var(--spacing-sm);
            border-radius: var(--radius-md);
            font-size: 0.8rem;
            font-weight: 600;
            z-index: 1000;
        }

        @media (max-width: 768px) {
            .page-title {
                font-size: 2rem;
            }
            .preview-container {
                padding: var(--spacing-md);
            }
            .tab-navigation {
                padding-bottom: var(--spacing-sm);
            }
        }
    </style>
</head>
<body>
    <div class="preview-watermark">PREVIEW MODE</div>
    <div class="preview-container">
        <div class="page-header">
            <h1 class="page-title">${pageData.title}</h1>
            <p class="page-description">${pageData.description}</p>
        </div>

        ${visibleTabs.length > 1 ? `
        <div class="tabs-container">
            <div class="tab-navigation">
                ${visibleTabs.map((tab, index) => `
                    <button class="tab-button${index === 0 ? ' active' : ''}" onclick="showTab('${tab.id}')">
                        ${tab.title}
                    </button>
                `).join('')}
            </div>

            ${visibleTabs.map((tab, index) => `
                <div class="tab-content${index === 0 ? ' active' : ''}" id="tab-${tab.id}">
                    ${tab.sections.filter(section => section.visible !== false).map(section => `
                        <div class="section">
                            <div class="section-header">
                                <h2 class="section-title">${section.title}</h2>
                            </div>
                            <div class="section-content">
                                ${section.items.filter(item => item.visible !== false).map(item => `
                                    <div class="content-item">
                                        <h3>${item.title}</h3>
                                        <div class="content-item-content">
                                            ${item.content}
                                        </div>
                                        ${item.sources ? `
                                            <div class="content-sources">
                                                <h4>Sources:</h4>
                                                ${convertUrlsToLinks(item.sources)}
                                            </div>
                                        ` : ''}
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
            `).join('')}
        </div>
        ` : firstTab ? `
        <div class="tab-content active">
            ${firstTab.sections.filter(section => section.visible !== false).map(section => `
                <div class="section">
                    <div class="section-header">
                        <h2 class="section-title">${section.title}</h2>
                    </div>
                    <div class="section-content">
                        ${section.items.filter(item => item.visible !== false).map(item => `
                            <div class="content-item">
                                <h3>${item.title}</h3>
                                <div class="content-item-content">
                                    ${item.content}
                                </div>
                                ${item.sources ? `
                                    <div class="content-sources">
                                        <h4>Sources:</h4>
                                        ${convertUrlsToLinks(item.sources)}
                                    </div>
                                ` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
            `).join('')}
        </div>
        ` : '<p>No content available for preview.</p>'}
    </div>

    <script>
        function showTab(tabId) {
            // Hide all tab contents
            const tabContents = document.querySelectorAll('.tab-content');
            tabContents.forEach(content => content.classList.remove('active'));

            // Remove active class from all tab buttons
            const tabButtons = document.querySelectorAll('.tab-button');
            tabButtons.forEach(button => button.classList.remove('active'));

            // Show selected tab content
            const selectedTab = document.getElementById('tab-' + tabId);
            if (selectedTab) {
                selectedTab.classList.add('active');
            }

            // Add active class to clicked button
            const clickedButton = event.target;
            clickedButton.classList.add('active');
        }
    </script>
</body>
</html>
    `;
  };

  return (
    <div className="preview-panel">
      <div className="preview-header">
        <h3>
          <Eye size={18} />
          Preview
        </h3>
      </div>

      <div className="preview-container">
        {isLoading && (
          <div className="preview-loading">
            <div className="spinner"></div>
            <p>Loading preview...</p>
          </div>
        )}

        <div className="preview-frame">
          <iframe
            ref={iframeRef}
            className="preview-iframe"
            srcDoc={generatePreviewHTML()}
            title="Content Preview"
            style={{ opacity: isLoading ? 0 : 1 }}
          />
        </div>
      </div>
    </div>
  );
}