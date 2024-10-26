import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Lock, Globe, Copy, Check, Download } from 'lucide-react';
import { cn } from "@/lib/utils";
import { saveAs } from 'file-saver';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from 'lucide-react';

const API_TOKEN = import.meta.env.VITE_ARENA_API_TOKEN;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const PER_PAGE = 100;

const ArenaFetcher = () => {
  const [url, setUrl] = useState('');
  const [urls, setUrls] = useState([]);
  const [channelInfo, setChannelInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

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

  const fetchChannelInfo = async (channelSlug) => {
    const headers = {
      'Authorization': `Bearer ${API_TOKEN}`,
      'Content-Type': 'application/json'
    };

    const response = await fetch(`${API_BASE_URL}/channels/${channelSlug}`, {
      headers
    });

    if (!response.ok) {
      throw new Error('Failed to fetch channel information');
    }

    return response.json();
  };

  const fetchUrls = async (channelSlug, page = 1) => {
    try {
      const headers = {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json'
      };

      const response = await fetch(
        `${API_BASE_URL}/channels/${channelSlug}/contents?per=${PER_PAGE}&page=${page}`, 
        { headers }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch channel contents');
      }

      const data = await response.json();
      
      const extractedUrls = data.contents.map(block => ({
        url: block.class === 'Link' ? block.source?.url : 
             block.class === 'Media' ? block.attachment?.url : 
             block.source,
        type: block.class.toLowerCase(),
        title: block.title,
        description: block.description
      })).filter(item => item.url);

      // Eliminate duplicates
      const uniqueUrls = Array.from(new Set(extractedUrls.map(item => item.url)))
        .map(url => extractedUrls.find(item => item.url === url));

      setHasMore(data.contents.length === PER_PAGE);
      return uniqueUrls;
    } catch (err) {
      throw new Error('Error fetching URLs from Are.na');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setUrls([]);
    setChannelInfo(null);
    setPage(1);
    setHasMore(true);

    try {
      const channelSlug = extractSlug(url);
      const channelData = await fetchChannelInfo(channelSlug);
      setChannelInfo(channelData);
      const fetchedUrls = await fetchUrls(channelSlug);
      setUrls(fetchedUrls);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (!channelInfo || !hasMore) return;

    setLoading(true);
    try {
      const nextPage = page + 1;
      const moreUrls = await fetchUrls(channelInfo.slug, nextPage);
      setUrls(prevUrls => [...prevUrls, ...moreUrls]);
      setPage(nextPage);
    } catch (err) {
      setError('Error loading more URLs');
    } finally {
      setLoading(false);
    }
  };

  const urlCounts = {
    all: urls.length,
    link: urls.filter(item => item.type === 'link').length,
    media: urls.filter(item => item.type === 'media').length,
    image: urls.filter(item => item.type === 'image').length
  };

  const filteredUrls = urls.filter(item => 
    filterType === 'all' || item.type === filterType
  );

  const handleCopyLinks = () => {
    const textToCopy = filteredUrls.map(item => 
      `${item.title || 'Untitled'}\n${item.description || 'No description'}\n${item.url}\n\n`
    ).join('');
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };

  const downloadMarkdown = () => {
    const markdownContent = filteredUrls.map(item => 
      `# ${item.title || 'Untitled'}\n\n${item.description || 'No description'}\n\n[${item.url}](${item.url})\n\n---\n\n`
    ).join('');
    
    const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' });
    const fileName = `${channelInfo.title.replace(/\s+/g, '_').toLowerCase()}_arena_blocks.md`;
    saveAs(blob, fileName);
  };

  const downloadJSON = () => {
    const jsonContent = JSON.stringify(filteredUrls, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8' });
    const fileName = `${channelInfo.title.replace(/\s+/g, '_').toLowerCase()}_arena_blocks.json`;
    saveAs(blob, fileName);
  };

  const handleCopyMarkdown = () => {
    const markdownContent = filteredUrls.map(item => 
      `# ${item.title || 'Untitled'}\n\n${item.description || 'No description'}\n\n[${item.url}](${item.url})\n\n---\n\n`
    ).join('');
    navigator.clipboard.writeText(markdownContent).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };

  const handleCopyPlainText = () => {
    const textContent = filteredUrls.map(item => 
      `${item.title || 'Untitled'}\n${item.description || 'No description'}\n${item.url}\n\n`
    ).join('');
    navigator.clipboard.writeText(textContent).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };

  const downloadCSV = () => {
    const csvContent = [
      // CSV header
      ['Title', 'Description', 'URL'].join(','),
      // CSV rows
      ...filteredUrls.map(item => [
        // Escape special characters and wrap in quotes
        `"${(item.title || 'Untitled').replace(/"/g, '""')}"`,
        `"${(item.description || 'No description').replace(/"/g, '""')}"`,
        `"${item.url}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const fileName = `${channelInfo.title.replace(/\s+/g, '_').toLowerCase()}_arena_blocks.csv`;
    saveAs(blob, fileName);
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      <div className="container mx-auto p-4 py-8 max-w-5xl">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-12 gap-4">
          <h1 className="text-4xl font-bold text-foreground">Are.na Fetcher</h1>
        </div>

        <div className="grid gap-8 md:grid-cols-[2fr,1fr]">
          <div className="space-y-8">
            <div className="bg-card p-6 rounded-lg shadow-sm">
              <h2 className="text-2xl font-semibold mb-4">Fetch Blocks</h2>
              <p className="text-muted-foreground mb-6">Enter an Are.na channel to fetch its contents</p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  type="text"
                  placeholder="Paste Are.na channel URL..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full"
                />
                <Button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Fetching
                    </>
                  ) : (
                    'Get Blocks'
                  )}
                </Button>
              </form>

              {error && (
                <Alert variant="destructive" className="mt-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>

            {urls.length > 0 && (
              <div className="bg-card p-6 rounded-lg shadow-sm">
                <h2 className="text-2xl font-semibold mb-4">Found {urls.length} Blocks</h2>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <Select onValueChange={setFilterType} defaultValue="all">
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All ({urlCounts.all})</SelectItem>
                      <SelectItem value="link">Links ({urlCounts.link})</SelectItem>
                      <SelectItem value="media">Media ({urlCounts.media})</SelectItem>
                      <SelectItem value="image">Images ({urlCounts.image})</SelectItem>
                    </SelectContent>
                  </Select>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-full sm:w-auto px-6 py-2 flex items-center justify-between">
                        Export
                        <ChevronDown className="ml-2 h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={handleCopyMarkdown}>
                        <Copy className="mr-2 h-4 w-4" />
                        Copy Markdown
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={downloadMarkdown}>
                        <Download className="mr-2 h-4 w-4" />
                        Download Markdown
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={downloadJSON}>
                        <Download className="mr-2 h-4 w-4" />
                        Download JSON
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={downloadCSV}>
                        <Download className="mr-2 h-4 w-4" />
                        Download CSV
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="space-y-2">
                  {filteredUrls.map((item, index) => (
                    <div key={index} className="hover:bg-muted/50 p-4 rounded transition-colors">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                        <div className="flex-grow">
                          <h3 className="font-semibold text-lg">{item.title || 'Untitled'}</h3>
                          <p className="text-sm text-muted-foreground mb-2">{item.description || 'No description'}</p>
                          <a 
                            href={item.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:text-primary/80 transition-colors text-sm break-all"
                          >
                            {item.url}
                          </a>
                        </div>
                        <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-full">
                          {item.type}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                {hasMore && (
                  <Button onClick={loadMore} disabled={loading} variant="outline" className="w-full mt-6">
                    {loading ? 'Loading...' : 'Load More'}
                  </Button>
                )}
              </div>
            )}
          </div>

          <div className="space-y-8">
            {channelInfo && (
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {channelInfo.title}
                    {channelInfo.status === 'private' ? (
                      <Lock className="h-4 w-4" />
                    ) : (
                      <Globe className="h-4 w-4" />
                    )}
                  </CardTitle>
                  <CardDescription>{channelInfo.metadata?.description || 'No description'}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {channelInfo.length} blocks • {channelInfo.follower_count} followers
                  </p>
                </CardContent>
              </Card>
            )}
            {urls.length > 0 && (
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle>Channel Stats</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(urlCounts).map(([type, count]) => (
                      <div key={type} className="flex justify-between items-center">
                        <span className="capitalize">{type}</span>
                        <span className="font-semibold">{count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArenaFetcher;
