export type Language = 'en' | 'es';
export type SectionKey = 'introduction' | 'bridge-stellar-xlm' | 'bridge-stellar-usdc' | 'quote' | 'gasless';

export interface DocsContentProps {
    language: Language;
    baseUrl: string;
}
