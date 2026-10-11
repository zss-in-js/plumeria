type SeoData = {
  title: string;
  subtitle?: string;
  path?: string;
};

export const ogpImagePath = (path: string) => `/ogp${path === '/' ? '/index' : path}.png`;

const generateSEOData = ({ title, subtitle, path = '/' }: SeoData) => {
  const image = {
    width: 1200,
    height: 630,
    url: `${process.env.PROD_URL}${ogpImagePath(path)}`,
  };

  return {
    title: title,
    description: subtitle,
    metadataBase: process.env.PROD_URL,
    alternates: {
      canonical: path,
    },
    openGraph: {
      title: title,
      description: subtitle,
      url: path,
      type: 'website',
      images: image,
    },
    twitter: {
      card: 'summary_large_image',
      title: title,
      description: subtitle,
      images: image,
    },
  };
};

export default generateSEOData;
