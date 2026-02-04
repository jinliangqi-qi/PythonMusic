import React, { useState, useRef, useEffect } from 'react';
import { Button, Slider } from 'antd';
import { 
  PlayCircleFilled, 
  PauseCircleFilled, 
  StepBackwardOutlined, 
  StepForwardOutlined,
  SoundOutlined,
  MutedOutlined
} from '@ant-design/icons';
import { usePlayerStore } from '../../store/usePlayerStore';

const MusicPlayer: React.FC = () => {
  const { currentSong, isPlaying, setIsPlaying, next, prev } = usePlayerStore();
  
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  
  // 监听播放状态变化 (暂停/播放)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    if (isPlaying) {
        audio.play().catch(e => {
            console.error("Play failed:", e);
            // 只有在真正的错误时才重置状态，避免切歌时的打断
            if (e.name !== 'AbortError') {
                setIsPlaying(false);
            }
        });
    } else {
        audio.pause();
    }
  }, [isPlaying]);

  // 监听切歌或重新点击播放
  useEffect(() => {
      const audio = audioRef.current;
      if (!audio) return;

      // 重置进度
      audio.currentTime = 0;
      // 如果当前应该是播放状态，则执行播放
      if (isPlaying) {
          audio.play().catch(e => {
               if (e.name !== 'AbortError') {
                   console.error("Play failed:", e);
               }
          });
      }
  }, [currentSong]); // 依赖 currentSong 对象引用变化

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => {
        setIsPlaying(false);
        next(); // 自动下一首
    };

    const handleError = (e: any) => {
        console.error("Audio playback error:", e);
        // 如果是资源加载失败（如 403 Forbidden），尝试自动播放下一首
        // 避免无限循环：如果只有一首歌或连续失败，可能需要更复杂的逻辑
        // 这里简单处理：播放失败就切下一首
        // 延迟一点切歌，避免太快
        setTimeout(() => {
            next();
        }, 1000);
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [next]);

  const togglePlay = () => {
    if (!currentSong) return;
    setIsPlaying(!isPlaying);
  };
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        // 如果当前焦点在输入框或文本域，不触发快捷键
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
            return;
        }

        if (e.code === 'Space') {
            e.preventDefault(); // 防止页面滚动
            togglePlay();
        }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
        window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isPlaying, currentSong]); // 依赖最新状态

  if (!currentSong) {
      // 如果没有歌曲，隐藏播放器
      // 为了调试，我们先返回 null，或者一个不可见的 div
      return null;
  }

  // 处理封面图片 URL
  const getCoverUrl = (url?: string) => {
      if (!url) return 'https://p1.music.126.net/6y-UleORITEDbvrOLV0Q8A==/5639395138885805.jpg'; // 默认图
      if (url.startsWith('http')) return url;
      return `${import.meta.env.VITE_API_BASE_URL.replace('/api/v1', '')}/${url}`;
  };
  
  // 处理音频 URL
  const getAudioUrl = (url?: string) => {
      if (!url) return '';
      if (url.startsWith('http')) return url;
      return `${import.meta.env.VITE_API_BASE_URL.replace('/api/v1', '')}/${url}`;
  };

  const handleTimeChange = (value: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = value;
    setCurrentTime(value);
  };

  const handleVolumeChange = (value: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    const newVolume = value / 100;
    audio.volume = newVolume;
    setVolume(newVolume);
    if (newVolume > 0 && isMuted) {
      setIsMuted(false);
      audio.muted = false;
    }
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    audio.muted = newMuted;
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      height: 80,
      background: 'rgba(255, 255, 255, 0.85)',
      backdropFilter: 'blur(20px) saturate(180%)',
      borderTop: '1px solid rgba(0, 0, 0, 0.05)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      padding: '0 24px',
      boxShadow: '0 -1px 10px rgba(0,0,0,0.02)'
    }}>
      <audio ref={audioRef} src={getAudioUrl(currentSong.url)} />
      
      {/* 歌曲信息 */}
      <div style={{ display: 'flex', alignItems: 'center', width: '30%', minWidth: 200 }}>
        <div style={{
          width: 48,
          height: 48,
          borderRadius: 8,
          overflow: 'hidden',
          boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
          marginRight: 16,
          flexShrink: 0
        }}>
          <img 
            src={getCoverUrl(currentSong.cover)} 
            alt="cover" 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
        <div style={{ overflow: 'hidden' }}>
          <div style={{ 
            fontWeight: 600, 
            fontSize: 14, 
            color: '#1d1d1f',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {currentSong.title}
          </div>
          <div style={{ 
            fontSize: 12, 
            color: '#86868b',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {currentSong.artist}
          </div>
        </div>
      </div>

      {/* 播放控制 */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: '0 20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
          <Button type="text" icon={<StepBackwardOutlined />} onClick={prev} style={{ color: '#86868b' }} />
          <div 
            onClick={togglePlay}
            style={{ 
              fontSize: 36, 
              color: '#1d1d1f', 
              cursor: 'pointer',
              margin: '0 16px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            {isPlaying ? <PauseCircleFilled /> : <PlayCircleFilled />}
          </div>
          <Button type="text" icon={<StepForwardOutlined />} onClick={next} style={{ color: '#86868b' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', width: '100%', maxWidth: 500 }}>
          <span style={{ fontSize: 11, color: '#86868b', width: 35, textAlign: 'right' }}>
            {formatTime(currentTime)}
          </span>
          <Slider
            min={0}
            max={duration}
            value={currentTime}
            onChange={handleTimeChange}
            tooltip={{ formatter: null }}
            style={{ flex: 1, margin: '0 12px' }}
            trackStyle={{ background: '#1d1d1f' }}
            handleStyle={{ borderColor: '#1d1d1f', boxShadow: 'none' }}
          />
          <span style={{ fontSize: 11, color: '#86868b', width: 35 }}>
            {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* 音量控制 */}
      <div style={{ width: '30%', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
        <div style={{ width: 120, display: 'flex', alignItems: 'center' }}>
          <Button 
            type="text" 
            icon={isMuted || volume === 0 ? <MutedOutlined /> : <SoundOutlined />} 
            onClick={toggleMute}
            style={{ color: '#86868b' }}
          />
          <Slider
            min={0}
            max={100}
            value={isMuted ? 0 : volume * 100}
            onChange={handleVolumeChange}
            style={{ flex: 1, marginLeft: 8 }}
            trackStyle={{ background: '#86868b' }}
            handleStyle={{ borderColor: '#86868b', boxShadow: 'none' }}
          />
        </div>
      </div>
    </div>
  );
};

export default MusicPlayer;
