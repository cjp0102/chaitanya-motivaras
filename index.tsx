import React, { useState, FormEvent, useRef, useEffect } from 'react';
import { createRoot } from 'react-dom/client';

type Platform = 'YouTube' | 'Instagram' | 'TikTok' | 'Unknown';

interface MediaInfo {
  id: string;
  title: string;
  thumbnail: string;
  platform: Platform;
  mediaType: 'video' | 'image';
}

// --- SVG Icon Components ---
const YouTubeIcon = () => (
  <svg viewBox="0 0 28 20" fill="currentColor" width="24" height="24"><path d="M27.5 3.1s-.3-2.1-1.2-3C25.3.3 24 .3 24 .3H4s-1.3 0-2.3.8C.8 2 .2 3.1.2 3.1S.2 5.6.2 8.2v3.5c0 2.6.3 5.2.3 5.2s.3 2.1 1.2 3c1 .8 2.3.8 2.3.8H24s1.3 0 2.3-.8c1-.8 1.2-3 1.2-3s.3-2.6.3-5.2V8.2c0-2.6-.3-5.1-.3-5.1zM11.2 14.4V5.9l8 4.3-8 4.2z"></path></svg>
);
const InstagramIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="24" height="24"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
);
const TikTokIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-2.43.03-4.83-1-6.7-2.9-1.85-1.85-2.76-4.23-2.91-6.59-.23-3.94.46-7.82 2.22-11.21 1.53-2.91 3.9-5.22 6.81-6.53.01-.01.02-.01.03-.02.5-.22 1.02-.4 1.55-.56.02-.01.03-.01.05-.02z"></path></svg>
);
const LinkIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="24"height="24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.72"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.72-1.72"></path></svg>
)

const App = () => {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mediaInfo, setMediaInfo] = useState<MediaInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');

  // Watermark states for undo/redo
  const DEFAULT_WATERMARK = 'chaitanyalinked';
  const [watermarkContent, setWatermarkContent] = useState<string>(DEFAULT_WATERMARK);
  const [watermarkHistory, setWatermarkHistory] = useState<string[]>([DEFAULT_WATERMARK]);
  const [historyPointer, setHistoryPointer] = useState<number>(0);
  const isUpdatingFromHistory = useRef(false); // Flag to prevent history updates when navigating history

  useEffect(() => {
    // Only update history if the change didn't originate from undo/redo
    if (!isUpdatingFromHistory.current) {
      if (watermarkContent !== watermarkHistory[historyPointer]) {
        // Trim history if we're not at the end (means new change after undo)
        const newHistory = watermarkHistory.slice(0, historyPointer + 1);
        setWatermarkHistory([...newHistory, watermarkContent]);
        setHistoryPointer(newHistory.length);
      }
    } else {
      isUpdatingFromHistory.current = false; // Reset flag
    }
  }, [watermarkContent]); // Only depend on watermarkContent

  const handleWatermarkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWatermarkContent(e.target.value);
  };

  const saveCurrentWatermarkState = () => {
    // This function can be used on blur or with a debounce to capture states
    // The useEffect already handles pushing to history on content change
    // when not navigating history.
  };

  const handleUndo = () => {
    if (historyPointer > 0) {
      isUpdatingFromHistory.current = true;
      const newPointer = historyPointer - 1;
      setHistoryPointer(newPointer);
      setWatermarkContent(watermarkHistory[newPointer]);
    }
  };

  const handleRedo = () => {
    if (historyPointer < watermarkHistory.length - 1) {
      isUpdatingFromHistory.current = true;
      const newPointer = historyPointer + 1;
      setHistoryPointer(newPointer);
      setWatermarkContent(watermarkHistory[newPointer]);
    }
  };

  const MOCK_VIDEO_LINKS = [
    { format: '1080p', type: 'MP4' }, { format: '720p', type: 'MP4' },
    { format: '480p', type: 'MP4' }, { format: 'Audio', type: 'MP3' },
  ];
  const MOCK_IMAGE_LINKS = [
    { format: 'High-Res', type: 'JPG' }, { format: 'Standard', type: 'JPG' },
    { format: 'WebP', type: 'WEBP' }, { format: 'Original', type: 'PNG' },
  ];

  const detectSocialMediaPlatform = (url: string): { platform: Platform; id: string | null } => {
    const ytMatch = url.match(/^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (ytMatch && ytMatch[1]) return { platform: 'YouTube', id: ytMatch[1] };
    
    const igMatch = url.match(/(?:https?:\/\/)?(?:www\.)?instagram\.com\/(?:p|reel)\/([a-zA-Z0-9_-]+)/);
    if (igMatch && igMatch[1]) return { platform: 'Instagram', id: igMatch[1] };

    const tkMatch = url.match(/(?:https?:\/\/)?(?:www\.)?tiktok\.com\/.*video\/(\d+)/);
    if (tkMatch && tkMatch[1]) return { platform: 'TikTok', id: tkMatch[1] };

    return { platform: 'Unknown', id: null };
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setMediaInfo(null);

    const { platform, id } = detectSocialMediaPlatform(url);

    if (platform === 'Unknown' || !id) {
      setError('Unsupported or invalid social media link.');
      return;
    }

    setIsLoading(true);

    // Simulate an API call
    setTimeout(() => {
      let newMediaInfo: MediaInfo | null = null;
      switch (platform) {
        case 'YouTube':
          newMediaInfo = {
            id,
            platform,
            mediaType: 'video',
            title: 'Your Awesome YouTube Video Title Goes Here',
            thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
          };
          break;
        case 'Instagram':
          newMediaInfo = {
            id,
            platform,
            mediaType: 'image',
            title: 'This is a beautiful post from Instagram!',
            thumbnail: `https://picsum.photos/seed/${id}/400/300`, // Placeholder image
          };
          break;
        case 'TikTok':
             newMediaInfo = {
                id,
                platform,
                mediaType: 'video',
                title: 'Check out this viral TikTok video!',
                // TikTok thumbnails are not easily accessible, using placeholder
                thumbnail: `https://picsum.photos/seed/${id}/300/400`,
             };
          break;
      }
      setMediaInfo(newMediaInfo);
      setIsLoading(false);
    }, 2000);
  };
  
  const handleFeedbackSubmit = (e: FormEvent) => {
    e.preventDefault();
    // In a real app, you would send this to a server
    console.log('Feedback submitted:', feedbackText);
    alert('Thank you for your feedback!');
    setIsFeedbackModalOpen(false);
    setFeedbackText('');
  };

  const PlatformDisplay = ({ platform }: { platform: Platform }) => {
    const icons: Record<Platform, React.ReactNode> = {
        YouTube: <YouTubeIcon />,
        Instagram: <InstagramIcon />,
        TikTok: <TikTokIcon />,
        Unknown: <LinkIcon />,
    };
    return (
        <div className="platform-info">
            {icons[platform]}
            <span>Source: {platform}</span>
        </div>
    );
  };

  const ResultDisplay = () => {
    if (isLoading) return <div className="spinner"></div>;
    if (error) return <p className="error-message">{error}</p>;
    if (mediaInfo) {
      const downloadLinks = mediaInfo.mediaType === 'video' ? MOCK_VIDEO_LINKS : MOCK_IMAGE_LINKS;
      const hasWatermark = watermarkContent.trim().length > 0;

      return (
        <div className="media-card">
          <div className="media-info">
            <img src={mediaInfo.thumbnail} alt={mediaInfo.title} />
            <div className="media-details">
              <PlatformDisplay platform={mediaInfo.platform} />
              <p className="media-title">{mediaInfo.title}</p>
            </div>
          </div>
          <div className="watermark-option">
            <label htmlFor="watermark-input" className="watermark-label">Watermark Text:</label>
            <input 
              type="text" 
              id="watermark-input"
              className="watermark-input"
              value={watermarkContent}
              onChange={handleWatermarkChange}
              onBlur={saveCurrentWatermarkState}
              placeholder="e.g., yournamehere"
              aria-label="Customize watermark text"
            />
            <button 
              onClick={handleUndo} 
              disabled={historyPointer === 0} 
              className="undo-redo-btn"
              aria-label="Undo watermark change"
            >
              Undo
            </button>
            <button 
              onClick={handleRedo} 
              disabled={historyPointer === watermarkHistory.length - 1} 
              className="undo-redo-btn"
              aria-label="Redo watermark change"
            >
              Redo
            </button>
          </div>
          <div className="download-options">
            {downloadLinks.map((link) => (
              <a 
                href="#" 
                onClick={(e) => {
                  e.preventDefault();
                  const message = hasWatermark
                    ? `Preparing your download with the '${watermarkContent}' watermark!`
                    : "Preparing your download!";
                  alert(message);
                }}
                key={link.format} 
                className="download-option-btn"
                aria-label={`Download in ${link.format} ${link.type}`}
              >
                {link.format} <span style={{ opacity: 0.7 }}>{link.type}</span>
              </a>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="app-container">
      <header className="header">
        <h1 className="glitch-header" data-text="CHAITANYA.Ins">CHAITANYA.Ins</h1>
        <p className="subtitle">Your All-in-One Media Downloader</p>
        <div className="social-links">
          <a
            href="https://www.instagram.com/cjpedits11/"
            target="_blank"
            rel="noopener noreferrer"
            className="social-link"
            aria-label="Follow cjpedits11 on Instagram"
          >
            <InstagramIcon />
            <span>Follow cjpedits11</span>
          </a>
        </div>
      </header>
      <main>
        <form className="input-form" onSubmit={handleSubmit}>
          <input
            type="text"
            className="url-input"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste any social media link here..."
            aria-label="Social Media URL Input"
            disabled={isLoading}
          />
          <button type="submit" className="download-btn" disabled={isLoading || !url}>
            Download
          </button>
        </form>
        <div className="results-container" style={{marginTop: '2rem'}}>
            <ResultDisplay />
        </div>
      </main>
    </div>
  );
};

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<App />);