export type Language = 'en' | 'es';
export type SectionKey = 'introduction' | 'quote';

export interface DocsContentProps {
    language: Language;
    baseUrl: string;
}
