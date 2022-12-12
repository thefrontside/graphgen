export const SITE = {
  title: 'Graphgen',
  description: 'Generate the graph, not just the data',
  defaultLanguage: 'en_US',
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

export const KNOWN_LANGUAGES = {
  English: 'en',
} as const;
export const KNOWN_LANGUAGE_CODES = Object.values(KNOWN_LANGUAGES);

export const GITHUB_EDIT_URL = `https://github.com/thefrontside/graphgen/tree/main/website`;

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
    'Basics': [
      { text: 'Introduction', link: 'en/introduction' },
      { text: 'Installation', link: 'en/installation' },
    ],
  },
};
