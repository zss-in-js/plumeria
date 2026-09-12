type SeoData = {
  title: string;
  subtitle?: string;
  date?: string;
  path?: string;
};

const generateSEOData = ({ title, subtitle, date = '', path = '/' }: SeoData) => {
  const image = {
    width: 1200,
    height: 630,
    url: `${process.env.PROD_URL}/api/ogp?title=${title}&date=${date}`,
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
