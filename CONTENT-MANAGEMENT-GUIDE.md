# 📝 Content Management Guide - Care Resource Hub v2

Complete guide for adding, editing, and managing content in the Care Resource Hub admin panel.

## 🔐 **Accessing the Admin Panel**

1. **Navigate to**: `http://your-domain.com/apps/rage4info/admin`
2. **Login credentials**:
   - **Email**: `admin@care.com`
   - **Password**: `admin123`

## 📋 **Content Structure Overview**

The content is organized in a hierarchical structure:

```
Pages (Caregiver, Care Recipient)
├── Tabs (Main categories)
│   ├── Sections (Sub-categories)
│   │   ├── Content Items (Individual resources)
│   │   │   ├── Title
│   │   │   ├── Rich Text Content
│   │   │   ├── Sources/Links
│   │   │   └── Order
```

## ➕ **Adding New Content**

### **Adding a New Tab**

1. Click the **"+ Add Tab"** button in the admin panel
2. Enter the **tab title** (e.g., "Financial Support", "Health Resources")
3. Use the **drag handles** (⋮⋮) to reorder tabs
4. Click **"Save Changes"**

### **Adding a New Section**

1. Click the **"+ Add Section"** button within a tab
2. Enter the **section title** (e.g., "Government Programs", "Insurance Options")
3. Use the **drag handles** to reorder sections
4. Click **"Save Changes"**

### **Adding a New Content Item**

1. Click the **"+ Add Content"** button within a section
2. Fill in the **content item details**:
   - **Title**: Clear, descriptive name
   - **Content**: Rich text using the TinyMCE editor
   - **Sources**: URLs or references (optional)
3. Click **"Save Content"**

## ✏️ **Editing Content**

### **Editing Tabs and Sections**

1. Click the **pencil icon (✏️)** next to any tab or section
2. **Edit the title** in the input field
3. Click the **checkmark (✓)** to save or **X** to cancel

### **Editing Content Items**

1. Click the **"Edit" button** on any content item
2. **Modify the content** using the rich text editor:
   - **Bold/Italic**: Use toolbar buttons
   - **Lists**: Bullet points and numbered lists
   - **Links**: Highlight text and click link button
   - **Headers**: Use format dropdown
3. **Update sources** if needed
4. Click **"Save Content"**

### **Rich Text Editor Features**

The TinyMCE editor supports:
- **Bold, Italic, Underline**
- **Headers** (H1, H2, H3)
- **Bullet and numbered lists**
- **Links** to external resources
- **Text alignment**
- **Undo/Redo**

## 🗑️ **Deleting Content**

### **Deleting Content Items**
1. Click the **trash icon (🗑️)** on any content item
2. **Confirm deletion** when prompted
3. Click **"Save Changes"** to persist

### **Deleting Sections**
1. Click the **trash icon (🗑️)** next to the section title
2. **All content items** in that section will be deleted
3. **Confirm deletion** when prompted

### **Deleting Tabs**
1. Click the **trash icon (🗑️)** next to the tab title
2. **All sections and content** in that tab will be deleted
3. **Confirm deletion** when prompted

## 📊 **Organizing Content**

### **Reordering Items**

1. **Drag and drop** using the handle icons (⋮⋮)
2. **Items can be reordered** within:
   - Tabs (changes tab order)
   - Sections (changes section order)
   - Content items (changes display order)
3. **Changes are saved automatically**

### **Moving Content Between Sections**

Currently not supported in the UI. Use the import/export tools for bulk reorganization.

## 📥 **Bulk Import Options**

### **Option 1: Structured Outline Format**

Create a text file with this format:

```
# PAGE: Caregiver
## TAB: Financial Support
### SECTION: Government Programs
#### ITEM: Medicare Benefits
Medicare provides health insurance for people 65 and older.

**Key Benefits:**
- Hospital insurance (Part A)
- Medical insurance (Part B)
- Prescription drugs (Part D)

Sources: https://medicare.gov
---
#### ITEM: Medicaid
State-run program providing healthcare for low-income individuals.
Sources: https://medicaid.gov
---

### SECTION: Private Insurance
#### ITEM: Supplemental Insurance
Information about Medigap policies...
---

## TAB: Health Resources
### SECTION: Medical Care
#### ITEM: Finding Doctors
Tips for finding healthcare providers...
---

# PAGE: Care Recipient
## TAB: Daily Living
### SECTION: Safety
#### ITEM: Home Safety
Making the home environment safer...
---
```

**Import command:**
```bash
node content-import.js import-outline your-content.txt
```

### **Option 2: CSV Format**

Create a CSV file with columns: Page, Tab, Section, Item, Content, Sources

```csv
Page,Tab,Section,Item,Content,Sources
Caregiver,Financial Support,Government Programs,Medicare Benefits,"Medicare provides health insurance...",https://medicare.gov
Caregiver,Financial Support,Government Programs,Medicaid,"State-run program...",https://medicaid.gov
Caregiver,Health Resources,Medical Care,Finding Doctors,"Tips for finding...",
Care Recipient,Daily Living,Safety,Home Safety,"Making the home environment...",
```

**Import command:**
```bash
node content-import.js import-csv your-content.csv
```

### **Option 3: JSON Format**

Export current content to see the structure:

```bash
node content-import.js export-json current-content.json
```

Then modify and re-import:

```bash
node content-import.js import-json modified-content.json
```

## 🔄 **Backup and Restore**

### **Creating Backups**

```bash
# Export current content
node content-import.js export-json backup-$(date +%Y%m%d).json

# Create MongoDB backup
mongodump --db care-resource-hub --out ./db-backup
```

### **Restoring from Backup**

```bash
# Restore from JSON
node content-import.js import-json backup-20250103.json

# Restore MongoDB
mongorestore --db care-resource-hub ./db-backup/care-resource-hub
```

## 🎨 **Content Best Practices**

### **Writing Effective Content**

1. **Clear Titles**: Use descriptive, searchable titles
2. **Structured Content**: Use headers, lists, and paragraphs
3. **Actionable Information**: Include specific steps or resources
4. **Current Sources**: Link to authoritative, up-to-date sources
5. **Consistent Formatting**: Use similar structure across items

### **Organization Tips**

1. **Logical Grouping**: Group related content in the same section
2. **Priority Ordering**: Put most important items first
3. **Balanced Sections**: Aim for 3-8 items per section
4. **Descriptive Section Names**: Use clear, specific section titles

### **SEO and Searchability**

1. **Keywords**: Include terms users might search for
2. **Synonyms**: Use alternative terms for the same concept
3. **Complete Information**: Provide comprehensive coverage of topics
4. **Cross-References**: Mention related resources

## 🔧 **Troubleshooting**

### **Common Issues**

**Content not saving:**
- Check your internet connection
- Refresh the page and try again
- Check browser console for errors

**Rich text editor not loading:**
- Ensure TinyMCE API key is valid
- Check if JavaScript is enabled
- Try a different browser

**Import failing:**
- Verify file format matches expected structure
- Check MongoDB connection
- Ensure proper file permissions

### **Getting Help**

1. **Check browser console** for error messages
2. **Review server logs**: `pm2 logs care-hub-api`
3. **Test API connectivity**: `curl http://localhost/apps/rage4info/api/health`
4. **Backup before major changes**

## 📱 **Mobile Considerations**

The admin panel is responsive, but for extensive content editing:
- **Use desktop/laptop** for best experience
- **Rich text editor** works better on larger screens
- **Drag and drop** may be limited on touch devices

---

## 🚀 **Quick Start Workflow**

1. **Login** to admin panel
2. **Export current content** as backup
3. **Prepare your content** in outline or CSV format
4. **Import bulk content** using the import script
5. **Fine-tune content** using the admin panel
6. **Test on frontend** to verify display
7. **Create regular backups**

---

*Happy content managing! 🎉*