import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface Song {
  id: number;
  title: string;
  artist: string; // 歌手名
  cover?: string;
  url: string; // 播放链接
}

interface PlayerState {
  currentSong: Song | null;
  isPlaying: boolean;
  playList: Song[];
  
  setCurrentSong: (song: Song) => void;
  setPlayList: (list: Song[]) => void;
  setIsPlaying: (playing: boolean) => void;
  play: (song: Song) => void;
  pause: () => void;
  next: () => void;
  prev: () => void;
}

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => ({
      currentSong: null,
      isPlaying: false,
      playList: [],

      setCurrentSong: (song) => set({ currentSong: song }),
      setPlayList: (list) => set({ playList: list }),
      setIsPlaying: (playing) => set({ isPlaying: playing }),
      
      play: (song) => {
        const { playList } = get();
        // 如果当前播放列表不包含该歌曲，加入列表开头（或者根据需求）
        const exists = playList.find(s => s.id === song.id);
        if (!exists) {
            set({ playList: [song, ...playList] });
        }
        set({ currentSong: song, isPlaying: true });
      },
      
      pause: () => set({ isPlaying: false }),

      next: () => {
          const { currentSong, playList } = get();
          if (!currentSong || playList.length === 0) return;
          const index = playList.findIndex(s => s.id === currentSong.id);
          const nextIndex = (index + 1) % playList.length;
          set({ currentSong: playList[nextIndex], isPlaying: true });
      },

      prev: () => {
          const { currentSong, playList } = get();
          if (!currentSong || playList.length === 0) return;
          const index = playList.findIndex(s => s.id === currentSong.id);
          const prevIndex = (index - 1 + playList.length) % playList.length;
          set({ currentSong: playList[prevIndex], isPlaying: true });
      }
    }),
    {
      name: 'music-player-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ 
          // 仅持久化部分状态，避免自动播放等问题
          currentSong: state.currentSong,
          playList: state.playList 
      }), 
    }
  )
);
