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
interface ILandingCardFeature {
    icon: string;
    text: string;
}
interface ILandingPageCard {
    title: string;
    description: string;
    buttonText: string;
    icon?: string;
    features?: ILandingCardFeature[];
}
interface ILandingPageConfig {
    heroTitle: string;
    heroSubtitle: string;
    caregiverCard: ILandingPageCard;
    careRecipientCard: ILandingPageCard;
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