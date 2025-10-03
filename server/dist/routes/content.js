"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const Content_1 = __importDefault(require("../models/Content"));
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const router = express_1.default.Router();
// Get content (from MongoDB or fallback to JSON file)
router.get('/', async (req, res) => {
    try {
        // Try to get from MongoDB first
        const content = await Content_1.default.findOne().sort({ updatedAt: -1 }).exec();
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
            const fallbackPath = path_1.default.join(__dirname, '../../data/content.json');
            const fileContent = await promises_1.default.readFile(fallbackPath, 'utf-8');
            const jsonContent = JSON.parse(fileContent);
            return res.json({
                success: true,
                data: jsonContent,
                source: 'fallback'
            });
        }
        catch (fileError) {
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
    }
    catch (error) {
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
        const updatedContent = await Content_1.default.findOneAndUpdate({}, {
            pages,
            metadata: {
                ...metadata,
                lastModified: new Date().toISOString()
            }
        }, {
            upsert: true,
            new: true,
            runValidators: true
        });
        // Also save to backup file
        try {
            const backupDir = path_1.default.join(__dirname, '../../data');
            await promises_1.default.mkdir(backupDir, { recursive: true });
            const backupPath = path_1.default.join(backupDir, 'content.json');
            await promises_1.default.writeFile(backupPath, JSON.stringify({ pages, metadata }, null, 2));
        }
        catch (fileError) {
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
    }
    catch (error) {
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
        const history = await Content_1.default.find()
            .select('metadata createdAt updatedAt')
            .sort({ updatedAt: -1 })
            .limit(10)
            .exec();
        res.json({
            success: true,
            data: history
        });
    }
    catch (error) {
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
        const content = await Content_1.default.findOne().sort({ updatedAt: -1 }).exec();
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
    }
    catch (error) {
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
        const importedContent = new Content_1.default({
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
    }
    catch (error) {
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
        const contentCount = await Content_1.default.countDocuments();
        const latestContent = await Content_1.default.findOne().sort({ updatedAt: -1 }).select('updatedAt metadata').exec();
        res.json({
            success: true,
            data: {
                totalVersions: contentCount,
                latestUpdate: latestContent?.updatedAt,
                version: latestContent?.metadata?.version || 'unknown'
            }
        });
    }
    catch (error) {
        res.json({
            success: false,
            error: 'Database not available',
            fallbackAvailable: true
        });
    }
});
exports.default = router;
//# sourceMappingURL=content.js.map