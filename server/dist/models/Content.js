"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
// Schema definitions
const ContentItemSchema = new mongoose_1.Schema({
    id: { type: String, required: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    sources: { type: String },
    lastUpdated: { type: String, required: true },
    order: { type: Number, required: true, default: 0 }
});
const SectionSchema = new mongoose_1.Schema({
    id: { type: String, required: true },
    title: { type: String, required: true },
    items: [ContentItemSchema],
    order: { type: Number, required: true, default: 0 },
    collapsible: { type: Boolean, default: true },
    expanded: { type: Boolean, default: false }
});
const TabSchema = new mongoose_1.Schema({
    id: { type: String, required: true },
    title: { type: String, required: true },
    icon: { type: String },
    sections: [SectionSchema],
    order: { type: Number, required: true, default: 0 },
    visible: { type: Boolean, default: true }
});
const PageSchema = new mongoose_1.Schema({
    id: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    tabs: [TabSchema],
    theme: { type: String, enum: ['light', 'dark'], default: 'light' }
});
const ContentSchema = new mongoose_1.Schema({
    pages: {
        type: Map,
        of: PageSchema,
        required: true
    },
    metadata: {
        version: { type: String, default: '2.0.0' },
        lastModified: { type: String, default: () => new Date().toISOString() },
        author: { type: String }
    }
}, {
    timestamps: true
});
// Indexes for better performance
ContentSchema.index({ 'metadata.lastModified': -1 });
ContentSchema.index({ 'pages.$.tabs.$.sections.$.items.$.lastUpdated': -1 });
// Pre-save middleware to update lastModified
ContentSchema.pre('save', function (next) {
    if (this.isModified()) {
        if (this.metadata) {
            this.metadata.lastModified = new Date().toISOString();
        }
        else {
            this.metadata = {
                version: '2.0.0',
                lastModified: new Date().toISOString()
            };
        }
    }
    next();
});
exports.default = mongoose_1.default.model('Content', ContentSchema);
//# sourceMappingURL=Content.js.map