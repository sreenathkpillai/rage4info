import mongoose, { Document, Schema } from 'mongoose';

// Interface for ContentItem
interface IContentItem {
  id: string;
  title: string;
  content: string;
  sources?: string;
  lastUpdated: string;
  order: number;
}

// Interface for Section
interface ISection {
  id: string;
  title: string;
  items: IContentItem[];
  order: number;
  collapsible: boolean;
  expanded?: boolean;
}

// Interface for Tab
interface ITab {
  id: string;
  title: string;
  icon?: string;
  sections: ISection[];
  order: number;
  visible: boolean;
}

// Interface for Page
interface IPage {
  id: string;
  title: string;
  description: string;
  tabs: ITab[];
  theme?: 'light' | 'dark';
}

// Interface for the main Content document
export interface IContentDocument extends Document {
  pages: {
    [pageId: string]: IPage;
  };
  metadata?: {
    version: string;
    lastModified: string;
    author?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Schema definitions
const ContentItemSchema = new Schema<IContentItem>({
  id: { type: String, required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  sources: { type: String },
  lastUpdated: { type: String, required: true },
  order: { type: Number, required: true, default: 0 }
});

const SectionSchema = new Schema<ISection>({
  id: { type: String, required: true },
  title: { type: String, required: true },
  items: [ContentItemSchema],
  order: { type: Number, required: true, default: 0 },
  collapsible: { type: Boolean, default: true },
  expanded: { type: Boolean, default: false }
});

const TabSchema = new Schema<ITab>({
  id: { type: String, required: true },
  title: { type: String, required: true },
  icon: { type: String },
  sections: [SectionSchema],
  order: { type: Number, required: true, default: 0 },
  visible: { type: Boolean, default: true }
});

const PageSchema = new Schema<IPage>({
  id: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  tabs: [TabSchema],
  theme: { type: String, enum: ['light', 'dark'], default: 'light' }
});

const ContentSchema = new Schema<IContentDocument>({
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
ContentSchema.pre('save', function(next) {
  if (this.isModified()) {
    if (this.metadata) {
      this.metadata.lastModified = new Date().toISOString();
    } else {
      this.metadata = {
        version: '2.0.0',
        lastModified: new Date().toISOString()
      };
    }
  }
  next();
});

export default mongoose.model<IContentDocument>('Content', ContentSchema);