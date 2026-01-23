import mongoose, { Document } from 'mongoose';
interface IContentItem {
    id: string;
    title: string;
    content: string;
    sources?: string;
    lastUpdated: string;
    order: number;
    visible?: boolean;
}
interface ISection {
    id: string;
    title: string;
    items: IContentItem[];
    order: number;
    collapsible: boolean;
    expanded?: boolean;
    visible?: boolean;
}
interface ITab {
    id: string;
    title: string;
    icon?: string;
    sections: ISection[];
    order: number;
    visible: boolean;
}
interface IPage {
    id: string;
    title: string;
    description: string;
    tabs: ITab[];
    theme?: 'light' | 'dark';
}
interface ILandingPageConfig {
    heroTitle: string;
    heroSubtitle: string;
    caregiverCard: {
        title: string;
        description: string;
        buttonText: string;
    };
    careRecipientCard: {
        title: string;
        description: string;
        buttonText: string;
    };
}
export interface IContentDocument extends Document {
    pages: {
        [pageId: string]: IPage;
    };
    landingPage?: ILandingPageConfig;
    metadata?: {
        version: string;
        lastModified: string;
        author?: string;
    };
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IContentDocument, {}, {}, {}, mongoose.Document<unknown, {}, IContentDocument, {}, {}> & IContentDocument & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Content.d.ts.map