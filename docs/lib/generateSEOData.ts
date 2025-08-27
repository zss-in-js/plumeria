type SeoData = {
  title: string;
  subtitle?: string;
  date?: string;
};

const generateSEOData = ({ title, subtitle, date }: SeoData) => {
  return {
    title: title,
    description: subtitle,
    metadataBase: new URL(process.env.PROD_URL || 'https://.io'),
    alternates: {
      canonical: '/',
    },
    openGraph: {
      title: title,
      description: subtitle,
      url: process.env.PROD_URL,
      type: 'website',
      images: {
        width: 1200,
        height: 600,
        url: `${process.env.PROD_URL}/api/ogp?title=${title}&date=${date}`,
      },
    },
    twitter: {
      card: 'summary_large_image',
      title: title,
      description: subtitle,
      images: {
        width: 1200,
        height: 600,
        url: `${process.env.PROD_URL}/api/ogp?title=${title}&date=${date}`,
      },
    },
  };
};

export default generateSEOData;
