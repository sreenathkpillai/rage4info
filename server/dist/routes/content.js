"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const Content_1 = __importDefault(require("../models/Content"));
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const auth_1 = require("./auth");
const router = express_1.default.Router();
// Helper function to check if MongoDB is available
const isMongoAvailable = () => {
    return mongoose_1.default.connection.readyState === 1;
};
// Get content (from MongoDB or fallback to JSON file)
router.get('/', async (req, res) => {
    try {
        let content = null;
        // Try to get from MongoDB only if it's available
        if (isMongoAvailable()) {
            try {
                content = await Content_1.default.findOne().sort({ updatedAt: -1 }).exec();
            }
            catch (mongoError) {
                console.warn('MongoDB query failed, falling back to file system:', mongoError);
            }
        }
        if (content) {
            return res.json({
                success: true,
                data: {
                    pages: content.pages,
                    landingPage: content.landingPage,
                    metadata: content.metadata
                },
                source: 'mongodb'
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
            console.warn('Fallback file not found, using default content');
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
router.put('/', auth_1.authenticateToken, async (req, res) => {
    try {
        const { pages, landingPage, metadata } = req.body;
        if (!pages) {
            return res.status(400).json({
                success: false,
                error: 'Pages data is required'
            });
        }
        const updatedMetadata = {
            ...metadata,
            lastModified: new Date().toISOString()
        };
        const update = {
            pages,
            metadata: updatedMetadata
        };
        if (landingPage !== undefined) {
            update.landingPage = landingPage;
        }
        let mongoSaved = false;
        let updatedContent = null;
        // Try to save to MongoDB if available
        if (isMongoAvailable()) {
            try {
                updatedContent = await Content_1.default.findOneAndUpdate({}, update, {
                    upsert: true,
                    new: true,
                    runValidators: true
                });
                mongoSaved = true;
            }
            catch (mongoError) {
                console.warn('Failed to save to MongoDB:', mongoError);
                mongoSaved = false;
            }
        }
        // Always save to backup file (primary storage if MongoDB unavailable)
        let fileSaved = false;
        try {
            const backupDir = path_1.default.join(__dirname, '../../data');
            await promises_1.default.mkdir(backupDir, { recursive: true });
            const backupPath = path_1.default.join(backupDir, 'content.json');
            // A request without landingPage must not erase the stored one from
            // the backup file (the Mongo path above preserves it the same way)
            let fileLandingPage = landingPage;
            if (fileLandingPage === undefined) {
                fileLandingPage = updatedContent?.landingPage;
            }
            if (fileLandingPage === undefined) {
                try {
                    const existing = JSON.parse(await promises_1.default.readFile(backupPath, 'utf-8'));
                    fileLandingPage = existing.landingPage;
                }
                catch {
                    // no existing backup to preserve from
                }
            }
            const contentToSave = { pages, landingPage: fileLandingPage, metadata: updatedMetadata };
            await promises_1.default.writeFile(backupPath, JSON.stringify(contentToSave, null, 2));
            fileSaved = true;
        }
        catch (fileError) {
            console.error('Failed to save to file:', fileError);
            fileSaved = false;
        }
        if (!mongoSaved && !fileSaved) {
            return res.status(500).json({
                success: false,
                error: 'Failed to save content to both MongoDB and file system'
            });
        }
        const responseData = updatedContent ? {
            pages: updatedContent.pages,
            landingPage: updatedContent.landingPage,
            metadata: updatedContent.metadata
        } : { pages, landingPage, metadata: updatedMetadata };
        res.json({
            success: true,
            data: responseData,
            message: 'Content saved successfully',
            storage: {
                mongodb: mongoSaved,
                file: fileSaved,
                primary: mongoSaved ? 'mongodb' : 'file'
            }
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
            landingPage: content.landingPage,
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
router.post('/import', auth_1.authenticateToken, async (req, res) => {
    try {
        const { pages, landingPage, metadata } = req.body;
        if (!pages) {
            return res.status(400).json({
                success: false,
                error: 'Invalid backup file format'
            });
        }
        // Create new content document from import
        const importedContent = new Content_1.default({
            pages,
            landingPage,
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
                landingPage: importedContent.landingPage,
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
        if (isMongoAvailable()) {
            try {
                const contentCount = await Content_1.default.countDocuments();
                const latestContent = await Content_1.default.findOne().sort({ updatedAt: -1 }).select('updatedAt metadata').exec();
                return res.json({
                    success: true,
                    data: {
                        totalVersions: contentCount,
                        latestUpdate: latestContent?.updatedAt,
                        version: latestContent?.metadata?.version || 'unknown',
                        storage: 'mongodb'
                    }
                });
            }
            catch (mongoError) {
                console.warn('MongoDB health check failed:', mongoError);
            }
        }
        // Check file system fallback
        try {
            const fallbackPath = path_1.default.join(__dirname, '../../data/content.json');
            const stats = await promises_1.default.stat(fallbackPath);
            const fileContent = await promises_1.default.readFile(fallbackPath, 'utf-8');
            const jsonContent = JSON.parse(fileContent);
            res.json({
                success: true,
                data: {
                    totalVersions: 1,
                    latestUpdate: stats.mtime,
                    version: jsonContent.metadata?.version || 'unknown',
                    storage: 'file'
                },
                message: 'Using file system fallback'
            });
        }
        catch (fileError) {
            res.json({
                success: true,
                data: {
                    totalVersions: 0,
                    latestUpdate: null,
                    version: 'default',
                    storage: 'default'
                },
                message: 'No stored content, using default structure'
            });
        }
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: 'Health check failed',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
exports.default = router;
//# sourceMappingURL=content.js.map