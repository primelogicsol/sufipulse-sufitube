import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get('title') || 'Sacred Sufi Music & Poetry';
  const subtitle = searchParams.get('subtitle') || 'Discover kalam, qawwali, and Sufi literature';

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1200 50%, #0a0a0a 100%)',
          fontFamily: 'serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative gold border */}
        <div style={{
          position: 'absolute', inset: '20px',
          border: '1px solid rgba(212,175,55,0.3)',
          borderRadius: '8px',
          display: 'flex',
        }} />

        {/* Corner ornaments */}
        <div style={{ position: 'absolute', top: '32px', left: '32px', width: '40px', height: '40px', borderTop: '2px solid #d4af37', borderLeft: '2px solid #d4af37', display: 'flex' }} />
        <div style={{ position: 'absolute', top: '32px', right: '32px', width: '40px', height: '40px', borderTop: '2px solid #d4af37', borderRight: '2px solid #d4af37', display: 'flex' }} />
        <div style={{ position: 'absolute', bottom: '32px', left: '32px', width: '40px', height: '40px', borderBottom: '2px solid #d4af37', borderLeft: '2px solid #d4af37', display: 'flex' }} />
        <div style={{ position: 'absolute', bottom: '32px', right: '32px', width: '40px', height: '40px', borderBottom: '2px solid #d4af37', borderRight: '2px solid #d4af37', display: 'flex' }} />

        {/* Brand name */}
        <div style={{
          fontSize: '22px',
          color: '#d4af37',
          letterSpacing: '6px',
          textTransform: 'uppercase',
          marginBottom: '24px',
          display: 'flex',
        }}>
          SufiPulse
        </div>

        {/* Arabic/Urdu decorative divider */}
        <div style={{
          fontSize: '32px',
          color: 'rgba(212,175,55,0.6)',
          marginBottom: '28px',
          display: 'flex',
        }}>
          ◆ ✦ ◆
        </div>

        {/* Main title */}
        <div style={{
          fontSize: title.length > 50 ? '38px' : '52px',
          fontWeight: 'bold',
          color: '#f5f0e0',
          textAlign: 'center',
          lineHeight: 1.2,
          maxWidth: '900px',
          marginBottom: '20px',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}>
          {title}
        </div>

        {/* Subtitle */}
        <div style={{
          fontSize: '22px',
          color: 'rgba(212,175,55,0.8)',
          textAlign: 'center',
          maxWidth: '700px',
          lineHeight: 1.4,
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}>
          {subtitle}
        </div>

        {/* Bottom tagline */}
        <div style={{
          position: 'absolute',
          bottom: '48px',
          fontSize: '16px',
          color: 'rgba(255,255,255,0.4)',
          letterSpacing: '2px',
          display: 'flex',
        }}>
          sufipulse.com
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
