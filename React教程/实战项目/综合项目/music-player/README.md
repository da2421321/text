# 音乐播放器

## 项目简介

功能丰富的音乐播放器，支持播放控制、播放列表管理、音量控制和循环模式。

## 技术栈

- React 18
- TypeScript
- HTML5 Audio API
- Context API（播放状态管理）
- Tailwind CSS

## 功能特性

- [x] 播放/暂停
- [x] 上一首/下一首
- [x] 进度条（可拖拽）
- [x] 音量控制（可静音）
- [x] 播放列表管理
- [x] 循环模式（单曲循环/列表循环/无循环）
- [x] 随机播放
- [x] 歌曲时长显示
- [x] 专辑封面展示
- [x] 播放模式切换
- [ ] 歌词显示
- [ ] 播放历史
- [ ] 收藏歌曲
- [ ] 在线音乐搜索

## 项目结构

```
music-player/
├── src/
│   ├── context/
│   │   └── PlayerContext.tsx
│   ├── components/
│   │   ├── Player.tsx
│   │   ├── Playlist.tsx
│   │   ├── ProgressBar.tsx
│   │   ├── VolumeControl.tsx
│   │   └── TrackInfo.tsx
│   ├── hooks/
│   │   └── useAudio.ts
│   ├── types/
│   │   └── index.ts
│   ├── data/
│   │   └── songs.ts
│   ├── App.tsx
│   └── main.tsx
├── public/
│   └── songs/
├── package.json
└── README.md
```

## 类型定义

```typescript
interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number; // 秒
  cover: string;
  src: string;
}

type PlayMode = 'none' | 'repeat-one' | 'repeat-all' | 'shuffle';

interface PlayerState {
  currentSong: Song | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  playMode: PlayMode;
  playlist: Song[];
  queue: Song[];
}
```

## 运行项目

```bash
npm install
npm run dev
```

## 核心代码

### PlayerContext.tsx

```tsx
import { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import { Song, PlayMode } from '../types';
import { defaultPlaylist } from '../data/songs';

const PlayerContext = createContext<any>(null);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playlist, setPlaylist] = useState<Song[]>(defaultPlaylist);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [playMode, setPlayMode] = useState<PlayMode>('repeat-all');

  const currentSong = playlist[currentIndex] || null;

  // 播放
  const play = useCallback(() => {
    audioRef.current?.play();
    setIsPlaying(true);
  }, []);

  // 暂停
  const pause = useCallback(() => {
    audioRef.current?.pause();
    setIsPlaying(false);
  }, []);

  // 切换播放
  const togglePlay = useCallback(() => {
    if (isPlaying) pause();
    else play();
  }, [isPlaying, play, pause]);

  // 下一首
  const playNext = useCallback(() => {
    if (playMode === 'shuffle') {
      const randomIndex = Math.floor(Math.random() * playlist.length);
      setCurrentIndex(randomIndex);
    } else if (currentIndex < playlist.length - 1) {
      setCurrentIndex(i => i + 1);
    } else if (playMode === 'repeat-all') {
      setCurrentIndex(0);
    }
  }, [currentIndex, playlist.length, playMode]);

  // 上一首
  const playPrev = useCallback(() => {
    if (currentTime > 3) {
      audioRef.current!.currentTime = 0;
    } else if (currentIndex > 0) {
      setCurrentIndex(i => i - 1);
    } else if (playMode === 'repeat-all') {
      setCurrentIndex(playlist.length - 1);
    }
  }, [currentIndex, currentTime, playlist.length, playMode]);

  // 跳转
  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  // 设置音量
  const setVolumeLevel = useCallback((level: number) => {
    if (audioRef.current) {
      audioRef.current.volume = level;
      setVolume(level);
      setIsMuted(level === 0);
    }
  }, []);

  // 切换静音
  const toggleMute = useCallback(() => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.volume = volume || 0.8;
        setIsMuted(false);
      } else {
        audioRef.current.volume = 0;
        setIsMuted(true);
      }
    }
  }, [isMuted, volume]);

  // 播放指定歌曲
  const playSong = useCallback((index: number) => {
    setCurrentIndex(index);
    setIsPlaying(true);
  }, []);

  // 格式化时间
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <PlayerContext.Provider value={{
      currentSong, isPlaying, currentTime, duration, volume, isMuted, playMode,
      playlist, audioRef,
      play, pause, togglePlay, playNext, playPrev, seek, setVolumeLevel,
      toggleMute, setPlayMode, playSong, formatTime,
    }}>
      {children}
      <audio
        ref={audioRef}
        src={currentSong?.src}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
        onEnded={playNext}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) throw new Error('usePlayer must be used within PlayerProvider');
  return context;
}
```

### Player.tsx

```tsx
import { usePlayer } from '../context/PlayerContext';

function Player() {
  const {
    currentSong, isPlaying, currentTime, duration, volume, playMode,
    togglePlay, playNext, playPrev, seek, setVolumeLevel, toggleMute,
    setPlayMode, formatTime,
  } = usePlayer();

  const modeIcons = { 'none': '➡', 'repeat-one': '🔂', 'repeat-all': '🔁', 'shuffle': '🔀' };

  return (
    <div className="player">
      <div className="player-content">
        {/* 歌曲信息 */}
        <div className="track-info">
          {currentSong ? (
            <>
              <img src={currentSong.cover} alt={currentSong.title} className="cover" />
              <div>
                <h3>{currentSong.title}</h3>
                <p>{currentSong.artist}</p>
              </div>
            </>
          ) : (
            <p className="no-song">选择一首歌曲开始播放</p>
          )}
        </div>

        {/* 控制按钮 */}
        <div className="player-controls">
          <button onClick={() => setPlayMode(playMode === 'repeat-all' ? 'repeat-one' : 'repeat-all')}>
            {modeIcons[playMode]}
          </button>
          <button onClick={playPrev}>⏮</button>
          <button className="play-btn" onClick={togglePlay}>
            {isPlaying ? '⏸' : '▶'}
          </button>
          <button onClick={playNext}>⏭</button>
          <button onClick={toggleMute}>🔊</button>
        </div>

        {/* 进度条 */}
        <div className="progress-section">
          <span className="time">{formatTime(currentTime)}</span>
          <input
            type="range"
            min={0}
            max={duration || 0}
            value={currentTime}
            onChange={e => seek(Number(e.target.value))}
            className="progress-bar"
          />
          <span className="time">{formatTime(duration)}</span>
        </div>

        {/* 音量 */}
        <div className="volume-section">
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={isMuted ? 0 : volume}
            onChange={e => setVolumeLevel(Number(e.target.value))}
            className="volume-slider"
          />
        </div>
      </div>
    </div>
  );
}
```
