'use client';
// Design Ref: §2.1/§5.4 — 카카오맵 SDK 임베드, 매물 좌표 중심 마커 1개
import { useEffect, useRef } from 'react';

interface KakaoMaps {
  load: (callback: () => void) => void;
  LatLng: new (lat: number, lng: number) => unknown;
  Map: new (container: HTMLElement, options: { center: unknown; level: number }) => unknown;
  Marker: new (options: { position: unknown; map: unknown }) => unknown;
}

declare global {
  interface Window {
    kakao: { maps: KakaoMaps };
  }
}

export function KakaoMapEmbed({ lat, lng }: { lat: number; lng: number }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const appKey = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;
    if (!appKey || !containerRef.current) return;

    const renderMap = () => {
      window.kakao.maps.load(() => {
        if (!containerRef.current) return;
        const center = new window.kakao.maps.LatLng(lat, lng);
        const map = new window.kakao.maps.Map(containerRef.current, { center, level: 4 });
        new window.kakao.maps.Marker({ position: center, map });
      });
    };

    if (window.kakao?.maps) {
      renderMap();
      return;
    }

    const script = document.createElement('script');
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false`;
    script.async = true;
    script.onload = renderMap;
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, [lat, lng]);

  if (!process.env.NEXT_PUBLIC_KAKAO_JS_KEY) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg bg-gray-100 text-sm text-gray-400">
        지도 표시 불가 (NEXT_PUBLIC_KAKAO_JS_KEY 미설정)
      </div>
    );
  }

  return <div ref={containerRef} className="h-64 w-full rounded-lg" />;
}
