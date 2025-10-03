#!/usr/bin/env node

/**
 * Content Import Utility for Care Resource Hub v2
 *
 * This script imports content from various formats into the database.
 * Supports JSON, CSV, and structured text formats.
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/care-resource-hub';

// Content Schema (matching server model)
const contentSchema = new mongoose.Schema({
  caregiver: {
    tabs: [{
      id: String,
      title: String,
      order: Number,
      sections: [{
        id: String,
        title: String,
        order: Number,
        items: [{
          id: String,
          title: String,
          content: String,
          sources: String,
          lastUpdated: String,
          order: Number
        }]
      }]
    }]
  },
  carerecipient: {
    tabs: [{
      id: String,
      title: String,
      order: Number,
      sections: [{
        id: String,
        title: String,
        order: Number,
        items: [{
          id: String,
          title: String,
          content: String,
          sources: String,
          lastUpdated: String,
          order: Number
        }]
      }]
    }]
  }
});

const Content = mongoose.model('Content', contentSchema);

/**
 * Import from JSON structure
 */
async function importFromJSON(filePath) {
  console.log(`📄 Importing from JSON: ${filePath}`);

  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  // Clear existing content
  await Content.deleteMany({});

  // Insert new content
  const content = new Content(data);
  await content.save();

  console.log('✅ JSON import completed');
}

/**
 * Import from structured outline format
 *
 * Expected format:
 * # PAGE: Caregiver
 * ## TAB: Financial Support
 * ### SECTION: Government Programs
 * #### ITEM: Medicare Benefits
 * Content goes here...
 * Sources: https://example.com
 * ---
 */
async function importFromOutline(filePath) {
  console.log(`📋 Importing from outline: ${filePath}`);

  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  const structure = {
    caregiver: { tabs: [] },
    carerecipient: { tabs: [] }
  };

  let currentPage = null;
  let currentTab = null;
  let currentSection = null;
  let currentItem = null;
  let itemContent = '';
  let itemSources = '';

  function saveCurrentItem() {
    if (currentItem && currentSection) {
      currentSection.items.push({
        id: generateId(currentItem),
        title: currentItem,
        content: itemContent.trim(),
        sources: itemSources.trim(),
        lastUpdated: new Date().toISOString(),
        order: currentSection.items.length
      });
      itemContent = '';
      itemSources = '';
    }
  }

  function generateId(text) {
    return text.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  }

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith('# PAGE:')) {
      saveCurrentItem();
      currentPage = trimmed.replace('# PAGE:', '').trim().toLowerCase();
      if (!structure[currentPage]) {
        structure[currentPage] = { tabs: [] };
      }
    } else if (trimmed.startsWith('## TAB:')) {
      saveCurrentItem();
      const tabTitle = trimmed.replace('## TAB:', '').trim();
      currentTab = {
        id: generateId(tabTitle),
        title: tabTitle,
        order: structure[currentPage].tabs.length,
        sections: []
      };
      structure[currentPage].tabs.push(currentTab);
    } else if (trimmed.startsWith('### SECTION:')) {
      saveCurrentItem();
      const sectionTitle = trimmed.replace('### SECTION:', '').trim();
      currentSection = {
        id: generateId(sectionTitle),
        title: sectionTitle,
        order: currentTab.sections.length,
        items: []
      };
      currentTab.sections.push(currentSection);
    } else if (trimmed.startsWith('#### ITEM:')) {
      saveCurrentItem();
      currentItem = trimmed.replace('#### ITEM:', '').trim();
    } else if (trimmed.startsWith('Sources:')) {
      itemSources = trimmed.replace('Sources:', '').trim();
    } else if (trimmed === '---') {
      saveCurrentItem();
      currentItem = null;
    } else if (currentItem && trimmed) {
      itemContent += line + '\n';
    }
  }

  saveCurrentItem(); // Save the last item

  // Clear existing content
  await Content.deleteMany({});

  // Insert new content
  const contentDoc = new Content(structure);
  await contentDoc.save();

  console.log('✅ Outline import completed');
}

/**
 * Import from CSV format
 */
async function importFromCSV(filePath) {
  console.log(`📊 Importing from CSV: ${filePath}`);

  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const headers = lines[0].split(',').map(h => h.trim());

  const structure = {
    caregiver: { tabs: [] },
    carerecipient: { tabs: [] }
  };

  // Expected CSV columns: Page, Tab, Section, Item, Content, Sources
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;

    const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    const [page, tab, section, item, content, sources] = values;

    if (!page || !tab || !section || !item) continue;

    const pageKey = page.toLowerCase();
    if (!structure[pageKey]) structure[pageKey] = { tabs: [] };

    let tabObj = structure[pageKey].tabs.find(t => t.title === tab);
    if (!tabObj) {
      tabObj = {
        id: generateId(tab),
        title: tab,
        order: structure[pageKey].tabs.length,
        sections: []
      };
      structure[pageKey].tabs.push(tabObj);
    }

    let sectionObj = tabObj.sections.find(s => s.title === section);
    if (!sectionObj) {
      sectionObj = {
        id: generateId(section),
        title: section,
        order: tabObj.sections.length,
        items: []
      };
      tabObj.sections.push(sectionObj);
    }

    sectionObj.items.push({
      id: generateId(item),
      title: item,
      content: content || '',
      sources: sources || '',
      lastUpdated: new Date().toISOString(),
      order: sectionObj.items.length
    });
  }

  function generateId(text) {
    return text.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  }

  // Clear existing content
  await Content.deleteMany({});

  // Insert new content
  const contentDoc = new Content(structure);
  await contentDoc.save();

  console.log('✅ CSV import completed');
}

/**
 * Export current content to JSON
 */
async function exportToJSON(outputPath) {
  console.log(`💾 Exporting to JSON: ${outputPath}`);

  const content = await Content.findOne();
  if (!content) {
    console.log('❌ No content found to export');
    return;
  }

  fs.writeFileSync(outputPath, JSON.stringify(content.toObject(), null, 2));
  console.log('✅ Export completed');
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log(`
Usage: node content-import.js <command> <file>

Commands:
  import-json <file.json>     Import from JSON format
  import-outline <file.txt>   Import from structured outline format
  import-csv <file.csv>       Import from CSV format
  export-json <file.json>     Export current content to JSON

Examples:
  node content-import.js import-outline client-content.txt
  node content-import.js import-csv content.csv
  node content-import.js export-json backup.json
    `);
    return;
  }

  const command = args[0];
  const filePath = args[1];

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('🔌 Connected to MongoDB');

    switch (command) {
      case 'import-json':
        await importFromJSON(filePath);
        break;
      case 'import-outline':
        await importFromOutline(filePath);
        break;
      case 'import-csv':
        await importFromCSV(filePath);
        break;
      case 'export-json':
        await exportToJSON(filePath);
        break;
      default:
        console.log('❌ Unknown command:', command);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

if (require.main === module) {
  main();
}