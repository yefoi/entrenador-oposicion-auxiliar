export interface SeoPage {
  path: string
  title: string
  description: string
  intro: string
  sections: [string, string][]
  keywords: string[]
}

export declare const blockPages: SeoPage[]
export declare const intentPages: SeoPage[]
