import express from 'express';
import Content from '../models/Content';
import fs from 'fs/promises';
import path from 'path';

const router = express.Router();

// Get content (from MongoDB or fallback to JSON file)
router.get('/', async (req, res) => {
  try {
    // Try to get from MongoDB first
    const content = await Content.findOne().sort({ updatedAt: -1 }).exec();

    if (content) {
      return res.json({
        success: true,
        data: {
          pages: content.pages,
          metadata: content.metadata
        }
      });
    }

    // Fallback to reading from file system
    try {
      const fallbackPath = path.join(__dirname, '../../data/content.json');
      const fileContent = await fs.readFile(fallbackPath, 'utf-8');
      const jsonContent = JSON.parse(fileContent);

      return res.json({
        success: true,
        data: jsonContent,
        source: 'fallback'
      });
    } catch (fileError) {
      // If no file exists, return default structure
      const defaultContent = {
        pages: {
          caregiver: {
            id: 'caregiver',
            title: 'Caregiver Resources',
            description: 'Comprehensive resources and information for professional and family caregivers.',
            tabs: []
          },
          carerecipient: {
            id: 'carerecipient',
            title: 'Care Recipient Resources',
            description: 'Information and support resources for individuals receiving care.',
            tabs: []
          }
        },
        metadata: {
          version: '2.0.0',
          lastModified: new Date().toISOString(),
          author: 'System'
        }
      };

      return res.json({
        success: true,
        data: defaultContent,
        source: 'default'
      });
    }
  } catch (error) {
    console.error('Error fetching content:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch content'
    });
  }
});

// Save/Update content
router.put('/', async (req, res) => {
  try {
    const { pages, metadata } = req.body;

    if (!pages) {
      return res.status(400).json({
        success: false,
        error: 'Pages data is required'
      });
    }

    // Update or create content in MongoDB
    const updatedContent = await Content.findOneAndUpdate(
      {},
      {
        pages,
        metadata: {
          ...metadata,
          lastModified: new Date().toISOString()
        }
      },
      {
        upsert: true,
        new: true,
        runValidators: true
      }
    );

    // Also save to backup file
    try {
      const backupDir = path.join(__dirname, '../../data');
      await fs.mkdir(backupDir, { recursive: true });

      const backupPath = path.join(backupDir, 'content.json');
      await fs.writeFile(backupPath, JSON.stringify({ pages, metadata }, null, 2));
    } catch (fileError) {
      console.warn('Failed to save backup file:', fileError);
      // Don't fail the request if backup fails
    }

    res.json({
      success: true,
      data: {
        pages: updatedContent.pages,
        metadata: updatedContent.metadata
      },
      message: 'Content saved successfully'
    });
  } catch (error) {
    console.error('Error saving content:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save content'
    });
  }
});

// Get content history/versions
router.get('/history', async (req, res) => {
  try {
    const history = await Content.find()
      .select('metadata createdAt updatedAt')
      .sort({ updatedAt: -1 })
      .limit(10)
      .exec();

    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('Error fetching content history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch content history'
    });
  }
});

// Create a backup/export
router.get('/export', async (req, res) => {
  try {
    const content = await Content.findOne().sort({ updatedAt: -1 }).exec();

    if (!content) {
      return res.status(404).json({
        success: false,
        error: 'No content found to export'
      });
    }

    // Set headers for file download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="content-backup-${Date.now()}.json"`);

    res.json({
      pages: content.pages,
      metadata: content.metadata,
      exportedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error exporting content:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export content'
    });
  }
});

// Restore from backup
router.post('/import', async (req, res) => {
  try {
    const { pages, metadata } = req.body;

    if (!pages) {
      return res.status(400).json({
        success: false,
        error: 'Invalid backup file format'
      });
    }

    // Create new content document from import
    const importedContent = new Content({
      pages,
      metadata: {
        ...metadata,
        lastModified: new Date().toISOString(),
        importedAt: new Date().toISOString()
      }
    });

    await importedContent.save();

    res.json({
      success: true,
      data: {
        pages: importedContent.pages,
        metadata: importedContent.metadata
      },
      message: 'Content imported successfully'
    });
  } catch (error) {
    console.error('Error importing content:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to import content'
    });
  }
});

// Health check for content API
router.get('/health', async (req, res) => {
  try {
    const contentCount = await Content.countDocuments();
    const latestContent = await Content.findOne().sort({ updatedAt: -1 }).select('updatedAt metadata').exec();

    res.json({
      success: true,
      data: {
        totalVersions: contentCount,
        latestUpdate: latestContent?.updatedAt,
        version: latestContent?.metadata?.version || 'unknown'
      }
    });
  } catch (error) {
    res.json({
      success: false,
      error: 'Database not available',
      fallbackAvailable: true
    });
  }
});

export default router;