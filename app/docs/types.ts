export type Language = 'en' | 'es';
export type SectionKey = 'intro' | 'usdc-xlm' | 'usdc-usdc' | 'quote';

export interface DocsContentProps {
    language: Language;
    baseUrl: string;
}
