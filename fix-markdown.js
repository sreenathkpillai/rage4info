#!/usr/bin/env node
/**
 * Markdown Asterisk Fix Script
 *
 * This script converts markdown formatting in content items to proper HTML:
 * - **text** → <strong>text</strong>
 * - *text* → <em>text</em>
 *
 * Usage: node fix-markdown.js [--dry-run]
 *
 * Options:
 *   --dry-run    Show what would be changed without saving
 */

const API_URL = process.env.API_URL || 'http://localhost:3001/api';

async function fetchContent() {
  const response = await fetch(`${API_URL}/content`);
  if (!response.ok) {
    throw new Error(`Failed to fetch content: ${response.status}`);
  }
  const data = await response.json();
  return data.data;
}

async function saveContent(content) {
  const response = await fetch(`${API_URL}/content`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(content)
  });
  if (!response.ok) {
    throw new Error(`Failed to save content: ${response.status}`);
  }
  return response.json();
}

function convertMarkdownToHtml(text) {
  if (!text || typeof text !== 'string') return text;

  let result = text;

  // Convert **text** to <h3>text</h3> (subheader)
  // These are typically section headers like "**Pay Range:**" or "**Responsibilities:**"
  result = result.replace(/\*\*([^*]+)\*\*/g, '<h3>$1</h3>');

  // Convert *text* to <em>text</em> (italic)
  // Only match single asterisks not part of ** pattern
  // Be careful not to match already converted tags
  result = result.replace(/(?<!\*)\*([^*<>]+)\*(?!\*)/g, '<em>$1</em>');

  return result;
}

function processContentItem(item, path) {
  const changes = [];

  if (item.content) {
    const original = item.content;
    const converted = convertMarkdownToHtml(original);

    if (original !== converted) {
      changes.push({
        path: `${path} > "${item.title}"`,
        field: 'content',
        original: original.substring(0, 100) + (original.length > 100 ? '...' : ''),
        converted: converted.substring(0, 100) + (converted.length > 100 ? '...' : ''),
        itemId: item.id
      });
      item.content = converted;
    }
  }

  if (item.sources) {
    const original = item.sources;
    const converted = convertMarkdownToHtml(original);

    if (original !== converted) {
      changes.push({
        path: `${path} > "${item.title}"`,
        field: 'sources',
        original: original.substring(0, 100) + (original.length > 100 ? '...' : ''),
        converted: converted.substring(0, 100) + (converted.length > 100 ? '...' : ''),
        itemId: item.id
      });
      item.sources = converted;
    }
  }

  return changes;
}

async function main() {
  const isDryRun = process.argv.includes('--dry-run');

  console.log('='.repeat(60));
  console.log('RAGE4INFO Markdown Fix Script');
  console.log('='.repeat(60));
  console.log(`Mode: ${isDryRun ? 'DRY RUN (no changes will be saved)' : 'LIVE'}`);
  console.log('');

  try {
    console.log('Fetching content from API...');
    const content = await fetchContent();

    const allChanges = [];

    // Process each page
    for (const [pageId, page] of Object.entries(content.pages)) {
      console.log(`\nProcessing page: ${pageId}`);

      // Process each tab
      for (const tab of page.tabs) {
        // Process each section
        for (const section of tab.sections) {
          // Process each content item
          for (const item of section.items) {
            const path = `${pageId} > ${tab.title} > ${section.title}`;
            const changes = processContentItem(item, path);
            allChanges.push(...changes);
          }
        }
      }
    }

    // Report changes
    console.log('\n' + '='.repeat(60));
    console.log(`Found ${allChanges.length} items with markdown formatting`);
    console.log('='.repeat(60));

    if (allChanges.length > 0) {
      console.log('\nChanges:');
      allChanges.forEach((change, i) => {
        console.log(`\n${i + 1}. ${change.path}`);
        console.log(`   Field: ${change.field}`);
        console.log(`   Before: ${change.original}`);
        console.log(`   After:  ${change.converted}`);
      });

      if (!isDryRun) {
        console.log('\nSaving changes...');
        await saveContent(content);
        console.log('✅ Content updated successfully!');
      } else {
        console.log('\n⚠️  DRY RUN: No changes were saved.');
        console.log('   Run without --dry-run to apply changes.');
      }
    } else {
      console.log('\n✅ No markdown formatting found. Content is clean!');
    }

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
