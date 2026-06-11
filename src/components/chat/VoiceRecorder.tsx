'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

interface VoiceRecorderProps {
  onSend: (blob: Blob, duration: number) => void;
  onCancel: () => void;
}

export default function VoiceRecorder({ onSend, onCancel }: VoiceRecorderProps) {
  const [recording, setRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [barHeights, setBarHeights] = useState<number[]>(
    Array.from({ length: 24 }, () => 4),
  );

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const animFrameRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      // Audio visualization
      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      analyserRef.current = analyser;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.start();
      setRecording(true);
      setDuration(0);

      // Duration counter
      intervalRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);

      // Waveform animation
      animFrameRef.current = setInterval(() => {
        if (analyserRef.current) {
          const data = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(data);
          const newHeights = Array.from({ length: 24 }, (_, i) => {
            const idx = Math.floor((i / 24) * data.length);
            return Math.max(4, (data[idx] / 255) * 32);
          });
          setBarHeights(newHeights);
        }
      }, 100);
    } catch (err) {
      console.error('Microphone access denied:', err);
    }
  }, []);

  const stopRecording = useCallback((): Promise<Blob> => {
    return new Promise((resolve) => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
          resolve(blob);
        };
        mediaRecorderRef.current.stop();
        // Stop all tracks
        mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
      }
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (animFrameRef.current) clearInterval(animFrameRef.current);
      setRecording(false);
      setBarHeights(Array.from({ length: 24 }, () => 4));
    });
  }, []);

  const handleSend = useCallback(async () => {
    const blob = await stopRecording();
    onSend(blob, duration);
  }, [stopRecording, onSend, duration]);

  const handleCancel = useCallback(async () => {
    await stopRecording();
    onCancel();
  }, [stopRecording, onCancel]);

  const handleToggle = useCallback(() => {
    if (recording) {
      handleSend();
    } else {
      startRecording();
    }
  }, [recording, handleSend, startRecording]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (animFrameRef.current) clearInterval(animFrameRef.current);
    };
  }, []);

  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 16px',
        background: 'var(--card-bg)',
        border: '1px solid var(--card-border)',
        borderRadius: 18,
        animation: 'fadeInUp 0.3s ease',
      }}
    >
      {/* Cancel button */}
      <button
        className="btn btn-icon btn-danger"
        onClick={handleCancel}
        style={{ fontSize: 14 }}
      >
        ✕
      </button>

      {/* Waveform visualization */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          height: 36,
        }}
      >
        {barHeights.map((h, i) => (
          <div
            key={i}
            style={{
              width: 3,
              height: h,
              borderRadius: 2,
              background: recording ? 'var(--danger-color)' : 'var(--text-muted)',
              transition: 'height 0.1s ease',
              opacity: recording ? 1 : 0.4,
            }}
          />
        ))}
      </div>

      {/* Timer */}
      <span
        style={{
          fontSize: 14,
          fontWeight: 600,
          fontVariantNumeric: 'tabular-nums',
          color: recording ? 'var(--danger-color)' : 'var(--text-muted)',
          direction: 'ltr',
          minWidth: 44,
          textAlign: 'center',
        }}
      >
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </span>

      {/* Recording indicator */}
      {recording && (
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: 'var(--danger-color)',
            animation: 'pulse 1.5s ease infinite',
          }}
        />
      )}

      {/* Record / Send button */}
      <button
        className={`btn btn-icon ${recording ? 'btn-primary' : 'btn-secondary'}`}
        onClick={handleToggle}
        style={{ fontSize: 18 }}
      >
        {recording ? '➤' : '🎤'}
      </button>
    </div>
  );
}
