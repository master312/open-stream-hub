import { StreamInstance } from "../types/stream";

export const demoStreams: StreamInstance[] = [
  {
    id: "1",
    name: "Main Event Stream",
    thumbnail: "https://picsum.photos/seed/1/800/600",
    title: "Main Event Stream",
    rtmpEndpoint: "rtmp://live.example.com/stream1",
    quality: "1080p60",
    isLive: true,
    destinations: [
      {
        id: "1",
        type: "twitch",
        name: "Twitch Channel",
        url: "rtmp://live.twitch.tv/app/live_123456789",
      },
      {
        id: "2",
        type: "youtube",
        name: "YouTube Live",
        url: "rtmp://a.rtmp.youtube.com/live2/ytk-123x-123x-123x",
      },
    ],
    analytics: {
      runtime: "2:45:30",
      viewers: 1234,
      bandwidth: "5.2 Mbps",
      cpuUsage: 45,
      viewerHistory: [
        { time: "14:00", count: 1000 },
        { time: "14:15", count: 1200 },
        { time: "14:30", count: 1100 },
        { time: "14:45", count: 1300 },
      ],
    },
  },
  {
    id: "2",
    name: "Gaming Stream",
    thumbnail: "https://picsum.photos/seed/2/800/600",
    title: "Late Night Gaming",
    rtmpEndpoint: "rtmp://live.example.com/stream2",
    quality: "720p60",
    isLive: false,
    destinations: [
      {
        id: "3",
        type: "twitch",
        name: "Gaming Channel",
        url: "rtmp://live.twitch.tv/app/live_987654321",
      },
      {
        id: "4",
        type: "youtube",
        name: "YouTube Gaming",
        url: "rtmp://a.rtmp.youtube.com/live2/ytk-456x-456x-456x",
      },
      {
        id: "5",
        type: "custom",
        name: "Discord Stream",
        url: "rtmp://discord.stream/live/key123",
      },
    ],
    analytics: {
      runtime: "4:20:15",
      viewers: 567,
      bandwidth: "3.8 Mbps",
      cpuUsage: 32,
      viewerHistory: [
        { time: "20:00", count: 400 },
        { time: "20:15", count: 550 },
        { time: "20:30", count: 600 },
        { time: "20:45", count: 567 },
      ],
    },
  },
  {
    id: "3",
    name: "Podcast Stream",
    thumbnail: "https://picsum.photos/seed/3/800/600",
    title: "Tech Talk Weekly",
    rtmpEndpoint: "rtmp://live.example.com/stream3",
    quality: "1080p30",
    isLive: true,
    destinations: [
      {
        id: "6",
        type: "youtube",
        name: "YouTube Podcast",
        url: "rtmp://a.rtmp.youtube.com/live2/ytk-789x-789x-789x",
      },
      {
        id: "7",
        type: "custom",
        name: "Podcast Platform",
        url: "rtmp://podcast.platform/live/stream789",
      },
    ],
    analytics: {
      runtime: "1:15:45",
      viewers: 892,
      bandwidth: "4.1 Mbps",
      cpuUsage: 28,
      viewerHistory: [
        { time: "10:00", count: 750 },
        { time: "10:15", count: 820 },
        { time: "10:30", count: 880 },
        { time: "10:45", count: 892 },
      ],
    },
  },
  {
    id: "4",
    name: "Education Stream",
    thumbnail: "https://picsum.photos/seed/4/800/600",
    title: "Programming Workshop",
    rtmpEndpoint: "rtmp://live.example.com/stream4",
    quality: "1080p30",
    isLive: true,
    destinations: [
      {
        id: "8",
        type: "youtube",
        name: "Education Channel",
        url: "rtmp://a.rtmp.youtube.com/live2/ytk-edu-123-123",
      },
      {
        id: "9",
        type: "custom",
        name: "Learning Platform",
        url: "rtmp://learn.platform/live/edu123",
      },
    ],
    analytics: {
      runtime: "0:45:20",
      viewers: 234,
      bandwidth: "3.5 Mbps",
      cpuUsage: 25,
      viewerHistory: [
        { time: "09:00", count: 150 },
        { time: "09:15", count: 180 },
        { time: "09:30", count: 210 },
        { time: "09:45", count: 234 },
      ],
    },
  },
  {
    id: "5",
    name: "Event Coverage",
    thumbnail: "https://picsum.photos/seed/5/800/600",
    title: "Tech Conference 2024",
    rtmpEndpoint: "rtmp://live.example.com/stream5",
    quality: "4K",
    isLive: false,
    destinations: [
      {
        id: "10",
        type: "youtube",
        name: "Conference Main",
        url: "rtmp://a.rtmp.youtube.com/live2/ytk-conf-main",
      },
      {
        id: "11",
        type: "twitch",
        name: "Tech Conference",
        url: "rtmp://live.twitch.tv/app/live_conf_2024",
      },
      {
        id: "12",
        type: "custom",
        name: "Conference Platform",
        url: "rtmp://conference.platform/live/main_stage",
      },
    ],
    analytics: {
      runtime: "6:30:00",
      viewers: 4567,
      bandwidth: "12.5 Mbps",
      cpuUsage: 75,
      viewerHistory: [
        { time: "08:00", count: 3000 },
        { time: "08:15", count: 3750 },
        { time: "08:30", count: 4200 },
        { time: "08:45", count: 4567 },
      ],
    },
  },
];
