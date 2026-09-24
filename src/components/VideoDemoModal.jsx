import React, { useRef, useState } from 'react';
import {
  X,
  Play,
  Pause,
  Maximize2,
  Download,
  ExternalLink,
  Volume2,
  VolumeX,
  RotateCcw,
  Sparkles,
  Calendar,
  Navigation,
  ShieldAlert,
  Radio,
  Clock,
  CheckCircle2
} from 'lucide-react';

export default function VideoDemoModal({
  isOpen,
  onClose,
  activeLanguage = 'en'
}) {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  if (!isOpen) return null;

  const togglePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  const handleSpeedChange = (speed) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
      setPlaybackSpeed(speed);
    }
  };

  const handleFullscreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      } else if (videoRef.current.webkitRequestFullscreen) {
        videoRef.current.webkitRequestFullscreen();
      }
    }
  };

  const restartVideo = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      {/* Modal Container */}
      <div
        className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-violet-600 to-sky-500 text-white shadow-md shadow-sky-500/20">
              <Play className="w-4 h-4 fill-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm sm:text-base font-black text-white">
                  {activeLanguage === 'ta' ? '🎥 WeatherGPT நேரலை செயல்முறை விளக்க வீடியோ' : '🎥 WeatherGPT Live System Demo'}
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                  HD 1080p
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {activeLanguage === 'ta'
                  ? 'வானிலை AI, 1800-2999 நாள்காட்டி, 100மீ அலாரம் & பேரிடர் SOS முழு செயல்விளக்கம்'
                  : 'Full demonstration of Weather AI, 1800-2999 Climate Calendar, 100m Alarm & SOS'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1.5">
            <a
              href="/demo-video.mp4"
              download="WeatherGPT-Demo-Video.mp4"
              title="Download Video File"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer border border-slate-700"
            >
              <Download className="w-4 h-4" />
            </a>
            <a
              href="/video.html"
              target="_blank"
              rel="noopener noreferrer"
              title="Open Standalone Video Tab"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer border border-slate-700"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-rose-600/80 text-slate-300 hover:text-white transition-colors cursor-pointer border border-slate-700"
              title="Close Video"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Video Player Frame */}
        <div className="relative bg-black flex-1 flex items-center justify-center min-h-[260px] sm:min-h-[400px] overflow-hidden group">
          <video
            ref={videoRef}
            src="/demo-video.mp4"
            className="w-full h-full max-h-[55vh] object-contain cursor-pointer"
            playsInline
            controls
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onVolumeChange={() => setIsMuted(videoRef.current?.muted || false)}
          >
            Your browser does not support HTML5 video streaming.
          </video>
        </div>

        {/* Bottom Quick Controls & Feature Highlights */}
        <div className="p-3.5 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 text-xs">
          {/* Playback speed chips */}
          <div className="flex items-center space-x-2">
            <span className="text-[11px] text-slate-400 font-bold">Speed:</span>
            {[1, 1.25, 1.5, 2].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => handleSpeedChange(s)}
                className={`px-2 py-0.5 rounded-lg font-mono text-[11px] font-bold transition-all cursor-pointer ${
                  playbackSpeed === s
                    ? 'bg-sky-500 text-white shadow-xs'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>

          {/* Quick Direct Links */}
          <div className="flex items-center space-x-2 text-[11px]">
            <a
              href="/demo-video.mp4"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-xl bg-violet-600/30 hover:bg-violet-600/50 border border-violet-500/40 text-violet-200 font-bold flex items-center space-x-1.5 transition-all cursor-pointer"
            >
              <Play className="w-3 h-3 fill-violet-300" />
              <span>{activeLanguage === 'ta' ? 'நேரடி வீடியோ இணைப்பு' : 'Direct MP4 Stream'}</span>
            </a>
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold transition-all cursor-pointer"
            >
              {activeLanguage === 'ta' ? 'மூடுக' : 'Close'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
