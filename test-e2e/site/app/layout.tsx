import '@plumeria/core/stylesheet';

const { ServerCSS } = require('@plumeria/next');

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <ServerCSS />
      </head>
      <body>{children}</body>
    </html>
  );
}
