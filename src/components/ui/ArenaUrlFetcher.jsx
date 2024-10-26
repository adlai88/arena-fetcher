import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

const ArenaUrlFetcher = () => {
  const [url, setUrl] = useState('');
  const [urls, setUrls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const extractSlug = (url) => {
    try {
      const match = url.match(/are\.na\/([^\/]+)\/([^\/]+)/);
      if (match && match[2]) {
        return match[2];
      }
      throw new Error('Invalid Are.na URL format');
    } catch (err) {
      throw new Error('Could not extract channel slug from URL');
    }
  };

  const fetchUrls = async (channelSlug) => {
    try {
      const response = await fetch(`https://api.are.na/v2/channels/${channelSlug}/contents`);
      if (!response.ok) {
        throw new Error('Failed to fetch channel contents');
      }
      const data = await response.json();
      
      const extractedUrls = data.contents
        .map(block => {
          if (block.class === 'Link') return block.source?.url;
          if (block.class === 'Media') return block.attachment?.url;
          if (block.source) return block.source;
          return null;
        })
        .filter(url => url);

      return [...new Set(extractedUrls)]; // Remove duplicates
    } catch (err) {
      throw new Error('Error fetching URLs from Are.na');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setUrls([]);

    try {
      const channelSlug = extractSlug(url);
      const fetchedUrls = await fetchUrls(channelSlug);
      setUrls(fetchedUrls);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Are.na URL Fetcher</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Paste Are.na channel URL..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Fetching
                  </>
                ) : (
                  'Fetch URLs'
                )}
              </Button>
            </div>
          </form>

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {urls.length > 0 && (
            <div className="mt-6 space-y-2">
              <h3 className="font-medium">Found {urls.length} URLs:</h3>
              <div className="bg-slate-50 p-4 rounded-md space-y-2">
                {urls.map((url, index) => (
                  <div key={index} className="break-all hover:bg-slate-100 p-2 rounded">
                    <a 
                      href={url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {url}
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ArenaUrlFetcher;