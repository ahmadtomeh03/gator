import fetch from "node-fetch";
import { XMLParser } from "fast-xml-parser";

export async function fetchFeed(feedURL: string) {
 
  const res = await fetch(feedURL, {
    headers: { "User-Agent": "gator" }
  });
  const xmlData = await res.text();

 
  const parser = new XMLParser();
  const parsed = parser.parse(xmlData);

 
  if (!parsed.rss?.channel) {
    throw new Error("Invalid RSS feed: missing channel");
  }

  const channel = parsed.rss.channel;
  let items: RSSItem[] = [];

 
  if (channel.item) {
    items = Array.isArray(channel.item) ? channel.item : [channel.item];
  }

 
  const validItems = items
    .filter(item => item.title && item.link && item.description && item.pubDate)
    .map(item => ({
      title: item.title,
      link: item.link,
      description: item.description,
      pubDate: item.pubDate
    }));

   return {
    channel: {
      title: channel.title,
      link: channel.link,
      description: channel.description,
      item: validItems
    }
  };
}
