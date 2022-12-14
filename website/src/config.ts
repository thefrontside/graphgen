export const SITE = {
  title: 'Graphgen',
  description: 'Generate the graph, not just the data',
  defaultLanguage: 'en_US'
};

export const OPEN_GRAPH = {
  image: {
    src: 'https://github.com/withastro/astro/blob/main/assets/social/banner-minimal.png?raw=true',
    alt: `graphgen logo depicting a bar chart that that also looks like people`
  },
  twitter: 'thefrontside',
};

// This is the type of the frontmatter you put in the docs markdown files.
export type Frontmatter = {
  title: string;
  description: string;
  layout: string;
  image?: { src: string; alt: string };
  dir?: 'ltr' | 'rtl';
  ogLocale?: string;
  lang?: string;
};

export const BASE_URL = import.meta.env.BASE_URL

export const KNOWN_LANGUAGES = {
  English: 'en',
} as const;

export const KNOWN_LANGUAGE_CODES = Object.values(KNOWN_LANGUAGES);

export const GITHUB_EDIT_URL = `https://github.com/thefrontside/graphgen/tree/HEAD/website`;

export const COMMUNITY_INVITE_URL = `https://discord.gg/frontside`;

// See "Algolia" section of the README for more information.
export const ALGOLIA = {
  indexName: 'XXXXXXXXXX',
  appId: 'XXXXXXXXXX',
  apiKey: 'XXXXXXXXXX',
};

export type Sidebar = Record<
  typeof KNOWN_LANGUAGE_CODES[number],
Record<string, { text: string; link: string }[]>
  >;
export const SIDEBAR: Sidebar = {
  en: {
    'Setup': [
      { text: 'Introduction', link: 'en/introduction' },
      { text: 'Installation', link: 'en/installation' },
    ],
    'Usage': [
      { text: 'fields', link: 'en/fields' },
      { text: 'relationships', link: 'en/relationships' },
//      { text: 'presets', link: 'en/presets' },
//      { text: 'directives', link: 'en/directives' },
//      { text: 'relationships', link: 'en/relationships' },
//      { text: 'relationships', link: 'en/relationships' },
    ],
  },
};
