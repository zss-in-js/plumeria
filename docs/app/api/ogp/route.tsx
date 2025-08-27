import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url as string);
  const hasTitle = searchParams.has('title');
  const title = hasTitle && searchParams.get('title')?.slice(0, 100);
  const hasDate = searchParams.has('date');
  const date = hasDate && searchParams.get('date')?.slice(0, 50);
  const url = process.env.NODE_ENV === 'development' ? 'http://localhost:3000/' : process.env.PROD_URL;

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          fontFamily: 'Geist Mono',
          fontSize: 60,
          fontWeight: 700,
          color: '#fff',
          backgroundImage: `url(${url + '/BACKGROUND.png'})`,
          backgroundSize: '1200px 630px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            padding: '200px',
            fontSize: '30px',
            color: 'rgb(188 188 188)',
            textAlign: 'center',
          }}
        >
          {title}
          <div
            style={{
              position: 'absolute',
              right: '40px',
              bottom: '20px',
              display: 'flex',
              fontSize: '24px',
            }}
          >
            {date}
          </div>
        </div>
      </div>
    ),
  );
}
